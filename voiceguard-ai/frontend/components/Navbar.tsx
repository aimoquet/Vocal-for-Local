import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="bg-primary/20 p-2 rounded-lg">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">Vocal for Local</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link href="/analyze" className="text-muted-foreground hover:text-foreground transition-colors">Analyzer</Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
          <Link href="/history" className="text-muted-foreground hover:text-foreground transition-colors">History</Link>
          <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/analyze">
            <Button variant="default" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Analyze Audio
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
