import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';
import { applySavedTheme } from './core/theme';

let _app = null;

export function mount(el = '#app', props = {}) {
	applySavedTheme();
	if (_app) return () => {
		_app.unmount();
		_app = null;
	};
	_app = createApp(App, props);
	_app.use(FloatingVue, {
		distance: 12,
		skidding: 0,
		delay: {
			show: 3000,
			hide: 100
		}
	});
	const vm = _app.mount(el);
	return () => {
		if (_app) {
			_app.unmount();
			_app = null;
		}
	};
}

// Auto-mount when running the PoC standalone (dev)
if (typeof document !== 'undefined' && document.querySelector('#app')) {
	mount('#app');
}
