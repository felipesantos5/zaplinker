import axios from "axios";

export async function getCountryFromIP(ip) {
  try {
    if (ip === "127.0.0.1" || ip === "::1") return "Local";

    const response = await axios.get(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_APIKEY}`);
    return response.data.country || "Desconhecido";
  } catch (error) {
    console.error("Erro na geolocalização:", error);
    return "Erro na busca";
  }
}
