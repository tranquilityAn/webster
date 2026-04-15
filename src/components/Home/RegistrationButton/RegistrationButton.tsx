import { useState } from 'react';
import './RegistrationButton.css';

export default function RegistrationButton() {
  const [status, setStatus] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setStatus('Отправка запроса...');
      const response = await fetch('/webster/v1/accounts/registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        setStatus(`Успешно: ${response.status}`);
      } else {
        setStatus(`Ошибка: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      setStatus(`Ошибка сети: ${error.message}`);
    }
  };

  return (
    <div className="registration-wrapper">
      <button className="registration-btn" onClick={handleClick}>
        Выполнить запрос к /webster/v1/accounts/registration
      </button>
      {status && <div className="status-message">{status}</div>}
    </div>
  );
}
