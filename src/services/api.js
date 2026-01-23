import { apiCall } from "../config/api";
const strip = (path = "") => String(path).replace(/^\/+/, ""); // enlève les / au début
const api = {
  get: (path) => apiCall(strip(path)),
  post: (path, body) =>
    apiCall(strip(path), {
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: (path, body) =>
    apiCall(strip(path), {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (path) =>
    apiCall(strip(path), {
      method: "DELETE",
    }),
};
export default api;