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
        <h1 className="text-2xl font-semibold text-zinc-100">{this.props.title}</h1>
        <p className="text-zinc-400">{this.props.description}</p>
        <button type="button" onClick={this.retry} className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
          {this.props.retryLabel}
        </button>
      </div>
    );
  }
}
