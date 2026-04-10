import './app/style.css';
import { createGameApp } from './app/createGameApp';

void createGameApp(document).catch((error: unknown) => {
  console.error('Failed to boot PaperShoot', error);
});
