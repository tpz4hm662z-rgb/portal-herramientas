export function imprimir({windowRef=globalThis.window}={}){if(typeof windowRef?.print!=="function")return false;windowRef.print();return true;}
