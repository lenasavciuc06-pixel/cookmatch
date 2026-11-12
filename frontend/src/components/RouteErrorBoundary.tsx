import React from 'react';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  title: string;
  description: string;
  retryLabel: string;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

export class RouteErrorBoundary extends React.Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  public state: RouteErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  private retry = (): void => {
    this.setState({ hasError: false });
  };

  public render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="mx-auto max-w-xl space-y-4 py-16 text-center" role="alert">
        <h1 className="text-2xl font-semibold text-text-primary">{this.props.title}</h1>
        <p className="text-text-muted">{this.props.description}</p>
        <button type="button" onClick={this.retry} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent">
          {this.props.retryLabel}
        </button>
      </div>
    );
  }
}
