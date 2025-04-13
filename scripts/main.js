document.addEventListener("DOMContentLoaded", () => {
    /***************************
     * Función: actualizarContadorDescripcion
     * Actualiza el contador de caracteres usados en el textarea de descripción.
     * Se asigna a window para que esté disponible globalmente.
     ***************************/
    window.actualizarContadorDescripcion = function () {
      const descripcion = document.getElementById("descripcion");
      const contador = document.getElementById("contadorQR");
      const MAX_QR_LENGTH = 1200; // Límite máximo para el QR (ajustable según nivel de corrección)
  
      if (descripcion && contador) {
        const largo = descripcion.value.trim().length;
        contador.textContent = `Tamaño del QR: ${largo} / ${MAX_QR_LENGTH} caracteres`;
        // Cambiar color si se acerca o supera el límite
        if (largo > MAX_QR_LENGTH) {
          contador.style.color = "red";
        } else {
          contador.style.color = "gray";
        }
      }
    };
  
    /***************************
     * Función: generarPDF
     * Valida el formulario, genera el código QR y luego crea el PDF.
     ***************************/
    window.generarPDF = function () {
      // Obtener el formulario
      const formulario = document.getElementById("formulario");
      if (!formulario) {
        alert("El formulario no existe. Por favor, verifica el HTML.");
        return;
      }
  
      // Validación: Recorrer campos de entrada (inputs, textarea y select) 
      // excepto para aquellos de la tabla de materiales
      const inputs = formulario.querySelectorAll("input, textarea, select");
      let datosValidos = true;
  
      try {
        inputs.forEach((input) => {
          const esMaterialCampo =
            input.closest("table") &&
            input.closest("table").querySelector("thead th")?.textContent.includes("Material");
  
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
  
      // Generar el código QR utilizando la descripción y el circuito.
      try {
        // Obtener la descripción y el circuito desde sus campos.
        const descripcion = document.querySelector('textarea[name="descripcion"]').value.trim();
        const circuito = document.getElementById("circuito").value.trim();
  
        // Crear el contenido QR. Se elimina el uso excesivo de saltos de línea para no aumentar el tamaño.
        const qrData = `Tarea: ${descripcion} | Circuito: ${circuito}`;
        const MAX_QR_LENGTH = 1200;
        if (qrData.length > MAX_QR_LENGTH) {
          alert(`El contenido del código QR es demasiado largo (${qrData.length} caracteres). Limitá la descripción o el circuito.`);
          return;
        }
  
        const qrContainer = document.getElementById("qrCode");
        if (!qrContainer) {
          console.error("Contenedor QR no encontrado");
          return;
        }
  
        // Limpiar contenido previo del contenedor y generar nuevo QR.
        qrContainer.innerHTML = "";
        new QRCode(qrContainer, {
          text: qrData,
          width: 200,
          height: 200,
          correctLevel: QRCode.CorrectLevel.M, // Nivel M para mayor capacidad
        });
      } catch (error) {
        console.error("Error generando QR:", error);
        alert("Error al generar el código QR.");
        return;
      }
  
      // Generación del PDF utilizando html2canvas y html2pdf
      try {
        setTimeout(() => {
          const nombreArchivo = `${document.querySelector('input[name="tablero"]').value}_formulario_mantenimiento.pdf`;
  
          html2canvas(formulario, { useCORS: true, scale: 3 })
            .then((canvas) => {
              html2pdf()
                .set({
                  margin: 0.15,
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
        }, 1500); // Retraso para asegurar que el QR se ha generado
      } catch (error) {
        console.error("Error general en generarPDF:", error);
      }
    };
  });
  

   //Sección de Captura de Imagen

  const video = document.getElementById("video");
  const captureBtn = document.getElementById("captureBtn");
  const fotoCanvas = document.getElementById("fotoCanvas");
  const imagenCapturada = document.getElementById("imagenCapturada");
  const uploadImg = document.getElementById("uploadImg");

  // Configurar getUserMedia para usar la cámara (trasera si es posible)
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    })
    .then(function(stream) {
      video.srcObject = stream;
      video.play();
    })
    .catch(function(err) {
      console.error("Error al acceder a la cámara:", err);
      alert("No se pudo acceder a la cámara.");
    });
  } else {
    alert("Tu dispositivo no soporta la captura de video.");
  }

  // Capturar imagen del video
  captureBtn.addEventListener("click", () => {
    const context = fotoCanvas.getContext("2d");
    context.drawImage(video, 0, 0, fotoCanvas.width, fotoCanvas.height);
    const dataURL = fotoCanvas.toDataURL("image/png");
    imagenCapturada.src = dataURL;
    imagenCapturada.style.display = "block";
  });

  // Manejar carga de imagen del dispositivo
  uploadImg.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      imagenCapturada.src = e.target.result;
      imagenCapturada.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

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
    
