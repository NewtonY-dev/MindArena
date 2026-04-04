export default function FormInput({ label, name, value, onChange, type = 'text', required = false, rows = 3, error, placeholder }) {
  const isTextarea = type === 'textarea';

  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      {isTextarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          placeholder={placeholder}
          className={error ? 'error' : ''}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={error ? 'error' : ''}
        />
      )}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
