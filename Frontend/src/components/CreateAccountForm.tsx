// import React, { useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form'

export interface CreateAccountFormData {
  username: string;
  email: string;
  password: string;
}

interface CreateAccountFormDataActive extends CreateAccountFormData {
  passwordConfirm: string;
}

export interface CreateAccountFormProps {
  onSubmit: (data: CreateAccountFormData) => void;
}

const CreateAccountForm = (props: CreateAccountFormProps): React.JSX.Element => {
  const { onSubmit } = props;

  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      passwordConfirm: ""
    },
    onSubmit: async ({ value }: { value: CreateAccountFormDataActive }) => {
      const { username, email, password } = value;

      onSubmit(({ username, email, password }));
    },
    validators: {
      onChange({ value }) {
        const { password, passwordConfirm } = value;

        if (password && passwordConfirm && password !== passwordConfirm) {
          return 'Passwords do not match';
        }

        return undefined;
      }
    }
  });

  const formErrorMap = useStore(form.store, (state) => state.errorMap);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div>
          {/** Field: username **/}
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) => {
                return !value ? 
                  'Username required'
                  : value.length < 3
                    ? 'Username must be at least three characters long'
                    : undefined;
              },
              onChangeAsyncDebounceMs: 500
            }}
            children={(field) => {
              return (
                <>
                  <label htmlFor={field.name}>Username</label>
                  <input
                    id={field.name}
                    name={field.name}
                    type="username"
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

        <div>
          {/** Field: passwordConfirm **/}
          <form.Field
            name="passwordConfirm"
            validators={{
              onChange: ({ value }) => {
                return !value ? 
                  'Password confirmation required'
                  : undefined;
              },
              onChangeAsyncDebounceMs: 500
            }}
            children={(field) => {
              return (
                <>
                  <label htmlFor={field.name}>Confirm Password</label>
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

        {formErrorMap.onChange && <em>Error: {formErrorMap.onChange}</em>}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <button type="submit" disabled={!canSubmit}>
              {isSubmitting ? '...' : 'Create Account'}
            </button>
          )}
        />
      </form>
    </div>
  );
};

export default CreateAccountForm;
