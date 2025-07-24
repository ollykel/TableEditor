// import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form'

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
}

const LoginForm = (props: LoginFormProps): React.JSX.Element => {
  const { onSubmit } = props;

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }: { value: LoginFormData }) => {
      onSubmit(value);
    }
  });

  return (
    <div>
      <h2>Login</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div>
          {/** Field: email **/}
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                return !value ? 
                  'Email required'
                  : value.length < 3
                    ? 'Email must be at least three characters long'
                    : undefined;
              },
              onChangeAsyncDebounceMs: 500
            }}
            children={(field) => {
              return (
                <>
                  <label htmlFor={field.name}>Email</label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {!field.state.meta.isValid && (
                    <em role="alert">{field.state.meta.errors.join(', ')}</em>
                  )}
                </>
              );
            }}
          />
        </div>

        <div>
          {/** Field: password **/}
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                return !value ? 
                  'Password required'
                  : value.length < 8
                    ? 'Password must be at least eight characters long'
                    : undefined;
              },
              onChangeAsyncDebounceMs: 500
            }}
            children={(field) => {
              return (
                <>
                  <label htmlFor={field.name}>Password</label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {!field.state.meta.isValid && (
                    <em role="alert">{field.state.meta.errors.join(', ')}</em>
                  )}
                </>
              );
            }}
          />
        </div>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <button type="submit" disabled={!canSubmit}>
              {isSubmitting ? '...' : 'Log in'}
            </button>
          )}
        />
      </form>
    </div>
  );
};

export default LoginForm;
