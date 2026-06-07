/** Патч Text до загрузки остальных модулей. */
import './src/setupAndroid';

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
