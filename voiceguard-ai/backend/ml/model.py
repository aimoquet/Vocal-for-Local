import torch
import torch.nn as nn
import torch.nn.functional as F

class SqueezeExcitation(nn.Module):
    """
    Squeeze-and-Excitation channel attention block to focus on
    critical frequency bands and vocoder artifact signatures.
    """
    def __init__(self, channels, reduction=16):
        super(SqueezeExcitation, self).__init__()
        self.fc1 = nn.Linear(channels, max(channels // reduction, 8), bias=False)
        self.fc2 = nn.Linear(max(channels // reduction, 8), channels, bias=False)

    def forward(self, x):
        b, c, _, _ = x.size()
        y = F.adaptive_avg_pool2d(x, 1).view(b, c)
        y = F.relu(self.fc1(y), inplace=True)
        y = torch.sigmoid(self.fc2(y)).view(b, c, 1, 1)
        return x * y.expand_as(x)

class ResidualBlock(nn.Module):
    """
    Residual convolutional block with Batch Normalization,
    LeakyReLU activation, and Squeeze-and-Excitation attention.
    """
    def __init__(self, in_channels, out_channels, stride=1):
        super(ResidualBlock, self).__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.act1 = nn.LeakyReLU(0.1, inplace=True)
        
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.se = SqueezeExcitation(out_channels)
        self.act2 = nn.LeakyReLU(0.1, inplace=True)

        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )
        else:
            self.shortcut = nn.Identity()

    def forward(self, x):
        residual = self.shortcut(x)
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.act1(out)
        
        out = self.conv2(out)
        out = self.bn2(out)
        out = self.se(out)
        
        out = out + residual
        out = self.act2(out)
        return out

class VocalForLocalCNN(nn.Module):
    """
    State-of-the-Art Deepfake Audio Detection Network:
    Deep Residual Spectrogram CNN with Squeeze-and-Excitation Attention
    and Dual-Statistical (Avg + Max) Feature Pooling.
    """
    def __init__(self, num_classes=2, in_channels=1):
        super(VocalForLocalCNN, self).__init__()
        
        # Initial stem
        self.stem = nn.Sequential(
            nn.Conv2d(in_channels, 32, kernel_size=3, stride=1, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.LeakyReLU(0.1, inplace=True)
        )
        
        # 4 Residual Stages with downsampling
        self.stage1 = nn.Sequential(
            ResidualBlock(32, 32, stride=1),
            nn.MaxPool2d(2, 2)  # 128x128 -> 64x64
        )
        self.stage2 = nn.Sequential(
            ResidualBlock(32, 64, stride=1),
            nn.MaxPool2d(2, 2)  # 64x64 -> 32x32
        )
        self.stage3 = nn.Sequential(
            ResidualBlock(64, 128, stride=1),
            nn.MaxPool2d(2, 2)  # 32x32 -> 16x16
        )
        self.stage4 = nn.Sequential(
            ResidualBlock(128, 256, stride=1),
            nn.MaxPool2d(2, 2)  # 16x16 -> 8x8
        )
        
        # Dual statistical pooling (captures both average spectral envelope and sharp vocoder anomalies)
        self.avg_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.max_pool = nn.AdaptiveMaxPool2d((1, 1))
        
        # Classifier Head (256 * 2 = 512 dimensions)
        self.classifier = nn.Sequential(
            nn.Linear(256 * 2, 128),
            nn.BatchNorm1d(128),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Dropout(0.4),
            nn.Linear(128, 64),
            nn.LeakyReLU(0.1, inplace=True),
            nn.Dropout(0.2),
            nn.Linear(64, num_classes)
        )

    def extract_features(self, x):
        """Extract bottleneck embeddings."""
        x = self.stem(x)
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.stage4(x)
        
        avg_feat = self.avg_pool(x).flatten(1)
        max_feat = self.max_pool(x).flatten(1)
        features = torch.cat([avg_feat, max_feat], dim=1)
        return features

    def forward(self, x):
        features = self.extract_features(x)
        logits = self.classifier(features)
        return logits
