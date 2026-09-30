// PayPal's JavaScript SDK v6 buttons are custom elements.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type PayPalButtonProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { type?: string };

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": PayPalButtonProps;
      "venmo-button": PayPalButtonProps;
    }
  }
}
