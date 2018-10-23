interface MockData {
    name: string;
    id: Number;
    number: string;
}

interface JSON_TYPE {
    data: MockData[]
}

declare module '*.json' {
    const value: JSON_TYPE;
    export default value;
}

declare module '*.pug' {
    const value: Function;
    export default value;
}