import { createGlobalStyle } from 'styled-components';
import { colors, typography } from './variables';
import { respondTo } from './mixins';

const GlobalStyles = createGlobalStyle`
  /* CSS Reset with enhanced accessibility */
  *,
  *::before,
  *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Remove default list and anchor styles */
  ul,
  ol {
    list-style: none;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  /* Form element normalization */
  button,
  input,
  select,
  textarea {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
  }

  /* Image handling */
  img,
  picture,
  video,
  canvas,
  svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  /* Touch device optimizations */
  @media (hover: hover) and (pointer: fine) {
    :root {
      --hover-supported: 1;
    }
  }

  /* Remove tap highlight on touch devices */
  -webkit-tap-highlight-color: transparent;

  /* Base HTML/Body styles */
  html {
    font-size: 16px;
    scroll-behavior: smooth;

    @media (prefers-reduced-motion: reduce) {
      scroll-behavior: auto;
    }

    ${respondTo('tablet')} {
      font-size: 17px;
    }

    ${respondTo('desktop')} {
      font-size: 18px;
    }
  }

  body {
    font-family: ${typography.fontFamily};
    font-size: ${typography.fontSize.md};
    line-height: ${typography.lineHeight.normal};
    font-weight: ${typography.fontWeight.regular};
    color: ${colors.text};
    background-color: ${colors.background};
    min-height: 100vh;
    text-rendering: optimizeLegibility;
    -webkit-text-size-adjust: 100%;
    
    @media (prefers-color-scheme: dark) {
      background-color: #1a1a1a;
      color: #ffffff;
    }
  }

  /* Typography scale */
  h1 {
    font-size: ${typography.fontSize.h1};
    line-height: ${typography.lineHeight.tight};
    font-weight: ${typography.fontWeight.bold};
    margin-bottom: 1em;
  }

  h2 {
    font-size: ${typography.fontSize.h2};
    line-height: ${typography.lineHeight.tight};
    font-weight: ${typography.fontWeight.bold};
    margin-bottom: 0.75em;
  }

  h3 {
    font-size: ${typography.fontSize.h3};
    line-height: ${typography.lineHeight.tight};
    font-weight: ${typography.fontWeight.medium};
    margin-bottom: 0.5em;
  }

  h4 {
    font-size: ${typography.fontSize.h4};
    line-height: ${typography.lineHeight.normal};
    font-weight: ${typography.fontWeight.medium};
    margin-bottom: 0.5em;
  }

  p {
    margin-bottom: 1em;
    max-width: 70ch;
  }

  /* Focus styles for accessibility */
  :focus-visible {
    outline: 2px solid ${colors.primary};
    outline-offset: 2px;
  }

  /* Selection styling */
  ::selection {
    background-color: ${colors.primary};
    color: #ffffff;
  }

  /* Utility classes */
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* RTL language support */
  [dir="rtl"] {
    text-align: right;
  }

  /* Print styles */
  @media print {
    body {
      background: #ffffff;
      color: #000000;
    }

    @page {
      margin: 2cm;
    }
  }
`;

export default GlobalStyles;