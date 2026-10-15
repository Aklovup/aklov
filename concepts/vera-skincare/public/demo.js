(() => {
  const dialog = document.querySelector('.demo-dialog');
  const description = document.querySelector('#demo-description');
  const notice = document.querySelector('.demo-context').textContent;
  let trigger;
  function explain(control) {
    trigger = control;
    const action = control.dataset.demoAction || 'Newsletter subscription';
    description.textContent = `${action}: this feature is not available in this design demonstration. ${notice}`;
    dialog.showModal();
  }
  document.addEventListener('click', (event) => {
    const control = event.target.closest('[data-demo-action]');
    if (!control) return;
    event.preventDefault();
    explain(control);
  });
  document.addEventListener('keydown', (event) => {
    const control = event.target.closest('[data-demo-action][role="button"]');
    if (control && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); explain(control); }
  });
  document.querySelectorAll('[data-demo-form]').forEach((form) => {
    form.addEventListener('submit', (event) => { event.preventDefault(); explain(form.querySelector('button')); });
  });
  document.querySelector('[data-demo-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const r = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => trigger?.focus());
})();
