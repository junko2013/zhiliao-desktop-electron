/// <reference types="vite/client" />
interface Window {
    api: {
      execute: (...args: unknown[]) => Promise<unknown>
    }
  }
  