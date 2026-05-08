import api from './api';

export const getAllCarouselSlides = async () => {
  const response = await api.get('/carousel');
  return response.data;
};

export const createCarouselSlide = async (slide) => {
  const response = await api.post('/carousel', slide);
  return response.data;
};

export const updateCarouselSlide = async (id, slide) => {
  const response = await api.put(`/carousel/${id}`, slide);
  return response.data;
};

export const deleteCarouselSlide = async (id) => {
  await api.delete(`/carousel/${id}`);
};
