if (typeof QRCode === 'undefined') {
    console.error("QRCode no está definido. Verifica que la biblioteca QRCode.js está correctamente cargada.");
    alert("Hubo un problema cargando QRCode.js. Por favor, revisa tu configuración.");
} else {
    console.log("QRCode está cargado correctamente.");
}

if (typeof html2pdf === 'undefined') {
    console.error("html2pdf.js no está definido. Verifica la inclusión de la biblioteca.");
    alert("Hubo un problema cargando html2pdf.js. Por favor, revisa tu configuración.");
} else {
    console.log("html2pdf.js está cargado correctamente.");
}

// Asegurarnos de que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    window.generarPDF = function () {
        const formulario = document.getElementById('formulario');
        if (!formulario) {
            console.error("El formulario con id='formulario' no existe en el DOM.");
            alert("El formulario no existe. Por favor, verifica el HTML.");
            return;
        }

        const inputs = formulario.querySelectorAll('input, textarea, select');
        let datosValidos = true;

        // Validación de campos importantes
        try {
            inputs.forEach((input) => {
                const esMaterialCampo = input.closest('table') && input.closest('table').querySelector('thead th').textContent.includes('Material');
                if (input.type === 'text' || input.type === 'textarea') {
                    if (input.value.trim() === '' && !esMaterialCampo) {
                        datosValidos = false;
                        alert(`Por favor, completa el campo: ${input.previousElementSibling?.textContent || "Campo desconocido"}`);
                        throw new Error(`Campo vacío detectado: ${input.previousElementSibling?.textContent || "Campo desconocido"}`);
                    }
                }
            });
        } catch (error) {
            console.error("Error durante la validación de los campos:", error);
            return;
        }

        if (!datosValidos) {
            return; // Detener el proceso si las validaciones fallan
        }

        // Configuración de la firma en canvas
        try {
            const canvas = document.getElementById('firmaCanvas');
            if (!canvas) {
                console.warn("El elemento canvas para la firma no existe. Se omitirá la firma.");
            } else {
                const ctx = canvas.getContext('2d');
                let dibujando = false;

                canvas.addEventListener('mousedown', () => dibujando = true);
                canvas.addEventListener('mouseup', () => dibujando = false);
                canvas.addEventListener('mouseout', () => dibujando = false);
                canvas.addEventListener('mousemove', dibujar);

                canvas.addEventListener('touchstart', () => dibujando = true);
                canvas.addEventListener('touchend', () => dibujando = false);
                canvas.addEventListener('touchcancel', () => dibujando = false);
                canvas.addEventListener('touchmove', function (e) {
                    const touch = e.touches[0];
                    const mouseEvent = new MouseEvent("mousemove", {
                        clientX: touch.clientX,
                        clientY: touch.clientY
                    });
                    canvas.dispatchEvent(mouseEvent);
                    e.preventDefault();
                });

                function dibujar(e) {
                    if (!dibujando) return;
                    const rect = canvas.getBoundingClientRect();
                    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
                    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.strokeStyle = '#000';
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                }

                function limpiarFirma() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.beginPath();
                }
            }
        } catch (error) {
            console.error("Error configurando el canvas para la firma:", error);
        }

        // Generar el QR dinámicamente
        try {
            const tablero = document.querySelector('input[name="tablero"]').value;
            const qrData = `TableroID: ${tablero}`;

            const qrContainer = document.getElementById('qrCode');
            if (!qrContainer) {
                console.error("El contenedor QR no existe en el DOM.");
                return;
            }

            qrContainer.innerHTML = ""; // Limpiar QR previo si existe
            new QRCode(qrContainer, {
                text: qrData,
                width: 150, // Aumenta el tamaño en píxeles
                height: 150,
                correctLevel: QRCode.CorrectLevel.L // Nivel de corrección más bajo (L)
            });
        } catch (error) {
            console.error("Error generando el código QR:", error);
            alert("Hubo un problema generando el código QR.");
            return;
        }

        // Generar el PDF
        try {
            setTimeout(() => {
                html2canvas(formulario, {
                    useCORS: true, // Asegura el procesamiento de imágenes externas
                    scale: 3 // Mejora la calidad
                }).then(canvas => {
                    const options = {
                        margin: 0.5,
                        filename: 'formulario_mantenimiento.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 3 },
                        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } // Configuración del PDF
                    };
                    html2pdf().set(options).from(canvas).save();
                }).catch(error => {
                    console.error("Error generando el PDF:", error);
                    alert("Hubo un problema generando el PDF. Revisa la consola para más detalles.");
                });
            }, 1500); // Retardo para garantizar que el QR esté renderizado
        } catch (error) {
            console.error("Error durante el proceso de generación del PDF:", error);
            alert("Hubo un problema con el proceso de generación del PDF.");
        }
    };
});
