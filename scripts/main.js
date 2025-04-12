document.addEventListener("DOMContentLoaded", () => {
    // Función principal para generar el PDF
    window.generarPDF = function () {
      const formulario = document.getElementById("formulario");
      if (!formulario) {
        alert("El formulario no existe. Por favor, verifica el HTML.");
        return;
      }
  
      const inputs = formulario.querySelectorAll("input, textarea, select");
      let datosValidos = true;
  
      try {
        inputs.forEach((input) => {
          const esMaterialCampo =
            input.closest("table") &&
            input
              .closest("table")
              .querySelector("thead th")
              .textContent.includes("Material");
  
          if ((input.type === "text" || input.tagName === "TEXTAREA") && !esMaterialCampo) {
            if (input.value.trim() === "") {
              datosValidos = false;
              const label = formulario.querySelector(`label[for="${input.id}"]`);
              const nombreCampo = label?.textContent || input.placeholder || "Campo obligatorio";
              alert(`Por favor, completa el campo: ${nombreCampo}`);
              throw new Error(`Campo vacío: ${nombreCampo}`);
            }
          }
        });
      } catch (error) {
        console.error("Error en validación:", error);
        return;
      }
  
      if (!datosValidos) return;
  
      // Generar código QR
      try {
        const tablero = document.querySelector('input[name="tablero"]').value;
        const qrData = `TableroID: ${tablero}`;
        const qrContainer = document.getElementById("qrCode");
  
        if (!qrContainer) {
          console.error("Contenedor QR no encontrado");
          return;
        }
  
        qrContainer.innerHTML = "";
        new QRCode(qrContainer, {
          text: qrData,
          width: 200,
          height: 200,
          correctLevel: QRCode.CorrectLevel.L,
        });
      } catch (error) {
        console.error("Error generando QR:", error);
        alert("Error al generar el código QR.");
        return;
      }
  
      // Captura y genera PDF
      try {
        setTimeout(() => {
          const nombreArchivo = `${document.querySelector('input[name="tablero"]').value}_formulario_mantenimiento.pdf`;
  
          html2canvas(formulario, { useCORS: true, scale: 3 })
            .then((canvas) => {
              html2pdf()
                .set({
                  margin: 0.5,
                  filename: nombreArchivo,
                  image: { type: "jpeg", quality: 0.98 },
                  html2canvas: { scale: 3 },
                  jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
                })
                .from(canvas)
                .save();
            })
            .catch((error) => {
              console.error("Error generando PDF:", error);
              alert("Error al generar el PDF.");
            });
        }, 1500);
      } catch (error) {
        console.error("Error general en generarPDF:", error);
      }
    };
  
    // Firma digital
    try {
      const canvas = document.getElementById("firmaCanvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        let dibujando = false;
  
        function obtenerPos(e) {
          const rect = canvas.getBoundingClientRect();
          const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
          const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
          return { x, y };
        }
  
        function dibujar(e) {
          if (!dibujando) return;
          const { x, y } = obtenerPos(e);
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#000";
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x, y);
          e.preventDefault();
        }
  
        // Mouse
        canvas.addEventListener("mousedown", () => (dibujando = true));
        canvas.addEventListener("mouseup", () => {
          dibujando = false;
          ctx.beginPath();
        });
        canvas.addEventListener("mousemove", dibujar);
        canvas.addEventListener("mouseout", () => (dibujando = false));
  
        // Táctil
        canvas.addEventListener("touchstart", () => (dibujando = true));
        canvas.addEventListener("touchend", () => {
          dibujando = false;
          ctx.beginPath();
        });
        canvas.addEventListener("touchmove", dibujar);
        canvas.addEventListener("touchcancel", () => (dibujando = false));
      }
    } catch (error) {
      console.error("Error con el canvas de firma:", error);
    }
  
    // Botón limpiar firma
    const btnLimpiarFirma = document.getElementById("limpiarFirmaBtn");
    if (btnLimpiarFirma) {
      btnLimpiarFirma.addEventListener("click", () => {
        const canvas = document.getElementById("firmaCanvas");
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      });
    }
  
    // Opcional: PDF automático al cargar (comentado por defecto)
    /*
    setTimeout(() => {
      if (typeof window.generarPDF === "function") {
        window.generarPDF();
      }
    }, 2000);
    */
  });
// Función global para agregar una fila a la tabla de materiales
function agregarFila() {
    const tabla = document.querySelector("#tablaMateriales tbody");
    if (!tabla) {
      console.error("Tabla de materiales no encontrada.");
      return;
    }
  
    const nuevaFila = document.createElement("tr");
  
    nuevaFila.innerHTML = `
      <td><input type="text" name="material[]" placeholder="Nombre del material" /></td>
      <td><input type="number" name="cantidad[]" placeholder="Cantidad" /></td>
      <td><input type="text" name="unidad[]" placeholder="Unidad" /></td>
      <td><button type="button" onclick="eliminarFila(this)">Eliminar</button></td>
    `;
  
    tabla.appendChild(nuevaFila);
  }
  
  // Función global para eliminar una fila de la tabla
  function eliminarFila(boton) {
    const fila = boton.closest("tr");
    fila.remove();
  }
    
