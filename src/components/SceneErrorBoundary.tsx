import { Component, type ReactNode } from 'react';

export class SceneErrorBoundary extends Component<{ children: ReactNode; onReturn: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="screen empty-impact" role="alert"><h2>DISTRICT UNAVAILABLE</h2><p>The scene could not load. Your identity and poster are saved.</p><button className="primary" onClick={this.props.onReturn}>RETURN TO CITY IMPACT</button></main>;
    return this.props.children;
  }
}
