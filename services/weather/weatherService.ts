// Não vamos mais usar o nosso 'api' interno para isso, vamos bater direto na Open-Meteo
export interface WeatherDTO {
  temp: number;
  windSpeed: number;
  windDirection: number;
}

export const weatherService = {
  // Agora recebemos latitude e longitude ao invés de 'city'
  getCurrentWeather: async (lat: number, lon: number): Promise<WeatherDTO> => {
    // Usamos a URL que você testou no curl, passando as variáveis lat e lon
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Pegamos o JSON gigante e separamos só o que o Valentim pediu
      return {
        temp: data.current_weather.temperature,
        windSpeed: data.current_weather.windspeed,
        windDirection: data.current_weather.winddirection,
      };
    } catch (error) {
      console.error("Erro ao buscar dados na Open-Meteo:", error);
      // Retorna valores zerados para o app não "quebrar" se a internet cair
      return { temp: 0, windSpeed: 0, windDirection: 0 };
    }
  },
};