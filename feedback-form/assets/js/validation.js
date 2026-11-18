/**
 * validation.js — валідація форми зворотного зв'язку.
 *
 * UX-логіка («хвалимо одразу, сваримо пізніше»):
 *  1. Після відкриття сторінки жодних помилок немає.
 *  2. Поле починає перевірятися лише після того, як користувач почав у нього вводити.
 *  3. input  — щойно значення стає валідним, поле одразу стає зеленим;
 *              помилка під час введення показується лише після першого blur або submit.
 *  4. blur   — фінальна перевірка поля, з яким користувач взаємодіяв.
 *  5. submit — перевіряє всі поля, навіть ті, яких ще не торкалися.
 *
 * Очікувані id в HTML:
 *  форма — feedbackForm; поля — username, email, phone, message, agreement;
 *  текст помилки — <p id="{id поля}-error">, наприклад username-error.
 */

// ===================== Налаштування =====================

// Формат email: щось@домен.зона (без пробілів)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Телефон: строго +380 і рівно 9 цифр, без пробілів, дужок і дефісів
const PHONE_REGEX = /^\+380\d{9}$/;

// Мінімальні довжини
const NAME_MIN_LENGTH = 2;
const MESSAGE_MIN_LENGTH = 10;

// Tailwind-класи для станів рамки поля
const CLASS_DEFAULT = 'border-slate-300';
const CLASS_ERROR = 'border-red-500';
const CLASS_SUCCESS = 'border-green-500';

// ===================== Стан взаємодії =====================

// Поля, в які користувач уже почав вводити
const dirtyFields = new Set();

// Поля, для яких уже була фінальна перевірка (blur або submit).
// Для них помилки показуються і під час введення.
const touchedFields = new Set();

// ===================== Відображення станів =====================

/** Повертає елемент для тексту помилки під полем. */
function getErrorElement(field) {
  return document.getElementById(`${field.id}-error`);
}

/** Встановлює текст під полем (порожній рядок — прибрати помилку). */
function setErrorText(field, text) {
  const errorElement = getErrorElement(field);
  if (errorElement) {
    errorElement.textContent = text;
  }
}

/** Стан помилки: червона рамка + текст під полем. */
function showError(field, message) {
  field.classList.remove(CLASS_DEFAULT, CLASS_SUCCESS);
  field.classList.add(CLASS_ERROR);
  field.setAttribute('aria-invalid', 'true'); // для екранних дикторів
  setErrorText(field, message);
}

/** Успішний стан: зелена рамка, текст помилки прибрано. */
function showSuccess(field) {
  field.classList.remove(CLASS_DEFAULT, CLASS_ERROR);
  field.classList.add(CLASS_SUCCESS);
  field.removeAttribute('aria-invalid');
  setErrorText(field, '');
}

/** Нейтральний стан: як після відкриття сторінки. */
function resetFieldState(field) {
  field.classList.remove(CLASS_ERROR, CLASS_SUCCESS);
  field.classList.add(CLASS_DEFAULT);
  field.removeAttribute('aria-invalid');
  setErrorText(field, '');
}

// ===================== Перевірка полів =====================
// Кожна функція повертає зрозумілий текст помилки або порожній рядок, якщо поле валідне.
// Правила: ім'я ≥ 2 символів, коректний email, телефон +380XXXXXXXXX,
// повідомлення ≥ 10 символів, згода відмічена.

/** Ім'я: не порожнє, мінімум 2 символи. */
function validateUsername(field) {
  const value = field.value.trim();

  if (value === '') return "Вкажіть, як до вас звертатися";
  if (value.length < NAME_MIN_LENGTH) return "Ім'я занадто коротке — мінімум 2 символи";
  return '';
}

/** Email: не порожній, коректний формат. */
function validateEmail(field) {
  const value = field.value.trim();

  if (value === '') return 'Вкажіть email, щоб ми могли вам відповісти';
  if (/\s/.test(value)) return 'Email не повинен містити пробілів';
  if (!value.includes('@')) return 'В email бракує символу @, наприклад: name@gmail.com';
  if (!EMAIL_REGEX.test(value)) return 'Перевірте домен після @, наприклад: name@gmail.com';
  return '';
}

/** Телефон: строго +380XXXXXXXXX. Підказка уточнює, що саме не так. */
function validatePhone(field) {
  const value = field.value.trim();

  if (value === '') return 'Вкажіть номер телефону, наприклад: +380501234567';
  if (PHONE_REGEX.test(value)) return '';

  if (!value.startsWith('+380')) {
    return 'Номер має починатися з +380, наприклад: +380501234567';
  }

  const rest = value.slice(4); // усе після +380
  if (/\D/.test(rest)) {
    return 'Введіть лише цифри — без пробілів, дужок і дефісів: +380501234567';
  }

  return `Після +380 має бути 9 цифр, зараз — ${rest.length}`;
}

/** Повідомлення: не порожнє, мінімум 10 символів. */
function validateMessage(field) {
  const value = field.value.trim();

  if (value === '') return 'Напишіть, чим ми можемо допомогти';
  if (value.length < MESSAGE_MIN_LENGTH) {
    return `Повідомлення занадто коротке — додайте ще ${MESSAGE_MIN_LENGTH - value.length} симв.`;
  }
  return '';
}

/** Згода: чекбокс обов'язково відмічений. */
function validateAgreement(field) {
  if (!field.checked) return 'Щоб надіслати форму, погодьтеся з політикою конфіденційності';
  return '';
}

// Відповідність: id поля → функція перевірки
const VALIDATORS = {
  username: validateUsername,
  email: validateEmail,
  phone: validatePhone,
  message: validateMessage,
  agreement: validateAgreement,
};

/** Повертає текст помилки для поля або порожній рядок. */
function getErrorMessage(field) {
  return VALIDATORS[field.id](field);
}

/**
 * Повна перевірка поля: показує помилку або успіх.
 * @returns {boolean} true, якщо поле валідне
 */
function validateField(field) {
  const errorMessage = getErrorMessage(field);

  if (errorMessage) {
    showError(field, errorMessage);
    return false;
  }

  showSuccess(field);
  return true;
}

/** Повертає масив усіх полів, які треба перевіряти. */
function getFields() {
  return Object.keys(VALIDATORS)
    .map((id) => document.getElementById(id))
    .filter(Boolean); // пропускаємо поле, якщо його немає в HTML
}

/**
 * Перевіряє всю форму. Фокус переводиться на перше невалідне поле.
 * @returns {boolean} true, якщо всі поля валідні
 */
function validateForm() {
  let isFormValid = true;
  let firstInvalidField = null;

  getFields().forEach((field) => {
    touchedFields.add(field); // після submit помилки оновлюються під час введення

    if (!validateField(field)) {
      isFormValid = false;
      firstInvalidField = firstInvalidField || field;
    }
  });

  if (firstInvalidField) {
    firstInvalidField.focus();
  }

  return isFormValid;
}

// ===================== Обробники подій полів =====================

/**
 * input: оновлює стан під час введення.
 *  - значення валідне → одразу зелений стан;
 *  - невалідне і поле вже перевірялося → показуємо помилку;
 *  - невалідне, але це перше введення → нейтральний стан, не заважаємо друкувати.
 */
function handleFieldInput(field) {
  dirtyFields.add(field);

  if (field.id === 'message') {
    updateMessageCounter(field);
  }

  const errorMessage = getErrorMessage(field);

  if (!errorMessage) {
    showSuccess(field);
  } else if (touchedFields.has(field)) {
    showError(field, errorMessage);
  } else {
    resetFieldState(field);
  }
}

/** blur: фінальна перевірка, але лише якщо користувач щось вводив у поле. */
function handleFieldBlur(field) {
  if (!dirtyFields.has(field)) return; // просто пройшли Tab-ом — не сваримо

  touchedFields.add(field);
  validateField(field);
}

/** change для чекбокса: клік — це вже взаємодія, перевіряємо одразу. */
function handleCheckboxChange(field) {
  dirtyFields.add(field);
  touchedFields.add(field);
  validateField(field);
}

/** Підключає обробники до одного поля. */
function attachFieldListeners(field) {
  if (field.type === 'checkbox') {
    field.addEventListener('change', () => handleCheckboxChange(field));
    return;
  }

  field.addEventListener('input', () => handleFieldInput(field));
  field.addEventListener('blur', () => handleFieldBlur(field));
}

// ===================== Лічильник символів =====================

/** Оновлює лічильник «0 / 1000» під полем повідомлення (якщо він є в HTML). */
function updateMessageCounter(field) {
  const counter = document.querySelector('#message-counter span');
  if (counter && field) {
    counter.textContent = field.value.length;
  }
}

// ===================== Відправка =====================

/** Повертає форму до початкового стану: без значень, помилок і історії взаємодії. */
function resetForm(form) {
  form.reset();
  dirtyFields.clear();
  touchedFields.clear();
  getFields().forEach(resetFieldState);
  updateMessageCounter(document.getElementById('message'));
}

/** Надсилає дані форми. Поки що — виводить їх у консоль. */
function sendForm(form) {
  const data = Object.fromEntries(new FormData(form));

  // TODO: замінити на fetch() до сервера, коли буде готовий backend
  console.log('Дані форми:', data);

  resetForm(form);
  openSuccessModal();
}

// ===================== Модальне вікно успіху =====================

// Елемент, на якому був фокус до відкриття вікна (кнопка «Надіслати»)
let focusBeforeModal = null;

/** Відкриває модальне вікно. Викликається лише після успішної валідації. */
function openSuccessModal() {
  const modal = document.getElementById('successModal');
  if (!modal || modal.open) return;

  focusBeforeModal = document.activeElement;

  // showModal(): вікно поверх сторінки, решта сторінки стає недоступною (inert),
  // Escape закриває вікно, фон затемнюється через ::backdrop
  modal.showModal();
  document.body.classList.add('overflow-hidden'); // сторінка під вікном не прокручується

  document.getElementById('successModalClose').focus();
}

/** Закриває модальне вікно. */
function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal && modal.open) {
    modal.close();
  }
}

/**
 * Спрацьовує після будь-якого закриття вікна (кнопка, Escape, клік по фону):
 * розблоковує прокрутку і повертає фокус туди, де він був.
 */
function handleModalClosed() {
  document.body.classList.remove('overflow-hidden');

  if (focusBeforeModal && typeof focusBeforeModal.focus === 'function') {
    focusBeforeModal.focus();
  }
  focusBeforeModal = null;
}

/** Клік по затемненому фону (поза вмістом вікна) закриває його. */
function handleModalBackdropClick(event) {
  if (event.target === event.currentTarget) {
    closeSuccessModal();
  }
}

/** Підключає обробники модального вікна. */
function initSuccessModal() {
  const modal = document.getElementById('successModal');
  const closeButton = document.getElementById('successModalClose');
  if (!modal || !closeButton) return;

  closeButton.addEventListener('click', closeSuccessModal);
  modal.addEventListener('click', handleModalBackdropClick);
  modal.addEventListener('close', handleModalClosed);
  // Escape обробляє сам <dialog>: він генерує подію cancel, а потім close
}

/** Обробник submit: зупиняємо стандартну відправку і перевіряємо всі поля. */
function handleSubmit(event) {
  event.preventDefault();

  if (!validateForm()) {
    return; // є помилки — форму не надсилаємо
  }

  sendForm(event.currentTarget);
}

// ===================== Запуск =====================

/** Ініціалізація: знаходимо форму і підключаємо обробники. */
function initFeedbackForm() {
  const form = document.getElementById('feedbackForm');
  if (!form) return;

  form.addEventListener('submit', handleSubmit);
  getFields().forEach(attachFieldListeners);
  initSuccessModal();
}

document.addEventListener('DOMContentLoaded', initFeedbackForm);
