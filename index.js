import axios from 'axios';

export default () => {
  axios.get('https://hexlet.io/courses').then((response) => console.log(response.data))
}
