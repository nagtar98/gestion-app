// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  /**
   * Configuración de conexión con el proyecto Supabase en la nube.
   * Sustituye estos valores con la URL y la Anon Key de tu proyecto en Supabase (Settings -> API).
   */
  supabase: {
    url: 'https://nembeporhkhneggqrtli.supabase.co',
    anonKey: 'sb_publishable_SiBY-_MjCGBFZfYuiKdQwg_RzUUocR_'
  }
};
