import * as yup from "yup";
import onChange from "on-change";
import render, { elements } from "./view.js";
import i18n from "i18next";
import resources from "./locales/index.js";
import axios from "axios";
import parseRSS from "./parseRSS.js";

const validate = (url, urls) =>
  yup.string().required().url().notOneOf(urls).validate(url);

export const state = {
  lng: "ru",
  form: {
    state: "filling",
    errors: []
  },
  urls: [],
  feeds: [],
  posts: []
};

const i18next = i18n.createInstance();
i18next.init({
  lng: state.lng,
  debug: false,
  resources
});

const buildProxyURL = (url) => {
  const proxyUrl = "https://allorigins.hexlet.app/raw?url=https://";
  const parsedUrl = new URL(url);
  const { host, pathname } = parsedUrl;
  return `${proxyUrl}${host}/${pathname}`;
};

const fetchRSS = (url) => axios.get(buildProxyURL(url));

export default () => {
  const watchedState = onChange(state, render(elements));
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const url = formData.get("url");
    const { urls } = state;

    validate(url, urls)
      .then((url) => {
        watchedState.urls.push(url);
        watchedState.form.errors = [];
        watchedState.form.state = "sending";
        return fetchRSS(url);
      })
      .then((RSS) => {
          const data = parseRSS(RSS);
          watchedState.feeds.unshift(data.feed);
          watchedState.posts = [...data.posts, ...watchedState.posts];
          watchedState.form.errors = [];
          watchedState.form.state = "success";
      })
      .catch((err) => {
        watchedState.form.state = "failed";
        watchedState.form.errors.push(err.type);
      });
  });
};
