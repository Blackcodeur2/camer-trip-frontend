import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import '@fontsource/inter';
import '@fontsource/poppins';
import '@fontsource/jetbrains-mono';
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
