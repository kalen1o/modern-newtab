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
        isRegisteredUser?: boolean
        /** URL template for search redirect; {q} is replaced with the query. Defaults to Google. */
        searchUrlTemplate?: string
    }
    const AutocompleteInput: React.ComponentType<AutocompleteInputProps>
    export default AutocompleteInput
    export type { AutocompleteInputProps }
}

declare module "news/News" {
    interface NewsGridProps {
        token?: string
    }
    const NewsGrid: React.ComponentType<NewsGridProps>
    export default NewsGrid
    export type { NewsGridProps }
}
