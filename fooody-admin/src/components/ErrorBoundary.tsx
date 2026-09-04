import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface State { hasError: boolean; error: Error | null; }
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('ErrorBoundary', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-8 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-[#DC2626] mx-auto" />
          <div className="font-semibold">Something went wrong</div>
          <div className="text-sm text-[#6B6B6B] break-all">{this.state.error?.message || 'Unknown error'}</div>
          <div className="text-xs text-[#9A9A9A]">Check browser console (F12) for details. Try refreshing or logging in again.</div>
          <div className="flex justify-center gap-2">
            <Button variant="secondary" onClick={() => this.setState({ hasError: false, error: null })}><RefreshCw className="h-4 w-4" /> Try again</Button>
            <Button onClick={() => window.location.reload()}>Reload page</Button>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}
