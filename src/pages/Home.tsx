import './Home.css';
import RegistrationButton from '../components/Home/RegistrationButton/RegistrationButton';

export default function Home() {
  return (
    <div className="home-page">
      <h1>Добро пожаловать в проект Webster</h1>
      <p>Связь фронтенда с бэкендом:</p>
      <RegistrationButton />
    </div>
  );
}
