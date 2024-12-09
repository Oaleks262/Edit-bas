document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const updateForm = document.getElementById('updateForm');
    const statusMessage = document.getElementById('statusMessage');
  
    // Функція для показу повідомлення
    const showStatusMessage = (message, type = 'info') => {
      statusMessage.textContent = message;
      statusMessage.className = `status-message ${type}`;
      statusMessage.style.display = 'block';
    };
  
    // Перевірка файлу перед відправкою форми
    const validateFile = (fileInput) => {
      const file = fileInput.files[0];
      if (file && file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        showStatusMessage('Будь ласка, завантажте файл у форматі Excel (.xlsx)', 'error');
        return false;
      }
      return true;
    };
  
    // Перехоплення подій на формах для завантаження файлів
    uploadForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const fileInput = document.getElementById('uploadFile');
      if (validateFile(fileInput)) {
        showStatusMessage('Завантаження файлу... Будь ласка, зачекайте.', 'info');
        uploadForm.submit(); // Дозволяємо відправити форму, якщо файл правильний
      }
    });
  
    updateForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const fileInput = document.getElementById('updateFile');
      if (validateFile(fileInput)) {
        showStatusMessage('Оновлення бази даних... Будь ласка, зачекайте.', 'info');
        updateForm.submit(); // Дозволяємо відправити форму, якщо файл правильний
      }
    });
  });
  