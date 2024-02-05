export function generarColorAleatorio() {
    var r = Math.floor(Math.random() * 128);
    var g = Math.floor(Math.random() * 128);
    var b = Math.floor(Math.random() * 256);

    // Ajusta los valores para asegurarte de que el color sea azul oscuro
    r = Math.min(r, 50);
    g = Math.min(g, 50);

    return `rgb(${r},${g},${b})`;
}
