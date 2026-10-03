import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
from ml.training.train import train_model

def run_training():
    """
    Directly triggers model training on the actual user dataset.
    """
    dataset_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../dataset'))
    if not os.path.exists(dataset_dir):
        dataset_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../dataset'))
        
    print(f"Training on dataset located at: {dataset_dir}")
    train_model(data_dir=dataset_dir, epochs=10, batch_size=16)

if __name__ == "__main__":
    run_training()
