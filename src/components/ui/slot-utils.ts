import * as React from 'react';

export function getSafeAsChildProps(
  componentName: string,
  asChild: boolean | undefined,
  children: React.ReactNode
) {
  if (!asChild) {
    return { asChild: false, children };
  }

  try {
    const child = React.Children.only(children);
    if (React.isValidElement(child)) {
      return { asChild: true, children };
    }
  } catch {
    // fall through to warning + fallback
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `${componentName} with \`asChild\` expects a single React element child. Falling back to default wrapper.`
    );
  }

  return { asChild: false, children };
}
