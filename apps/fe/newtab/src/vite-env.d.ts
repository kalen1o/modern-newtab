/// <reference types="vite/client" />

declare module '*.css' {
    const content: any;
    export default content;
}

// Module Federation remote declarations
declare module 'autocomplete/Autocomplete' {
    const AutocompleteInput: React.ComponentType<any>;
    export default AutocompleteInput;
}

declare module 'news/News' {
    const NewsGrid: React.ComponentType<any>;
    export default NewsGrid;
}
