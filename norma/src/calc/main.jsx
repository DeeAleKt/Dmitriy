// Сторінка в claude.ai: дані — в особистому розділі акаунта Claude (див. cloud.js), поза claude.ai — лише на телефоні.
import './styles.css';
import { render } from 'preact';
import { App } from './App.jsx';
import { connect } from './cloud.js';

const backend = { provider: 'claude', connect: typeof window.claude?.use === 'function' ? connect : null };

render(<App backend={backend} />, document.getElementById('app'));
