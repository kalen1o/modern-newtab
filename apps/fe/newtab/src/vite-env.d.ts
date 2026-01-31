/// <reference types="vite/client" />

declare module "*.css" {
  const content: string
  export default content
}

// Module Federation remote declarations
declare module "autocomplete/Autocomplete" {
  interface AutocompleteInputProps {
    logoSrc?: string
    onSearch?: (query: string) => void
    onFocusChange?: (isFocused: boolean) => void
  }
  const AutocompleteInput: React.ComponentType<AutocompleteInputProps>
  export default AutocompleteInput
}

declare module "news/News" {
  const NewsGrid: React.ComponentType<React.PropsWithChildren>
  export default NewsGrid
}
