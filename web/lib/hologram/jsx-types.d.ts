import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      hologramMaterial: any;
      ringSegmentMaterial: any;
      cardHologramMaterial: any;
    }
  }
}
