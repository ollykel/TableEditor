// import React, { useState } from 'react';
import { useForm, useStore } from '@tanstack/react-form'

import { FormFieldWrapper } from '@/components/Form';
import Button from '@/components/Button';

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
    <div className="items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col"
      >
        <div>
          {/** Field: username **/}
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) => {
                return !value
                  ? 'Username required'
                  : value.length < 3
                  ? 'Username must be at least three characters long'
                  : undefined;
              },
              onChangeAsyncDebounceMs: 500,
            }}
            children={(field) => <FormFieldWrapper
                field={field}
                label="Username"
                type="text"
              />
            }
          />
        </div>

        <div>
          {/** Field: email **/}
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                return !value
                  ? 'Email required'
                  : value.length < 3
                  ? 'Email must be at least three characters long'
                  : undefined;
              },
              onChangeAsyncDebounceMs: 500,
            }}
            children={(field) => <FormFieldWrapper
                field={field}
                label="Email"
                type="email"
              />
            }
          />
        </div>

        <div>
          {/** Field: password **/}
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                return !value
                  ? 'Password required'
                  : value.length < 8
                  ? 'Password must be at least eight characters long'
                  : undefined;
              },
              onChangeAsyncDebounceMs: 500,
            }}
            children={(field) => <FormFieldWrapper
                field={field}
                label="Password"
                type="password"
              />
            }
          />
        </div>

        <div>
          {/** Field: passwordConfirm **/}
          <form.Field
            name="passwordConfirm"
            validators={{
              onChange: ({ value }) => {
                return !value ? 'Password confirmation required' : undefined;
              },
              onChangeAsyncDebounceMs: 500,
            }}
            children={(field) => <FormFieldWrapper
                field={field}
                label="Confirm Password"
                type="password"
              />
            }
          />
        </div>

        {formErrorMap.onChange && <em>Error: {formErrorMap.onChange}</em>}

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <div className="flex w-full justify-center">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="bg-blue-600 hover:bg-blue-400 w-1/2"
              >
                {isSubmitting ? '...' : 'Create Account'}
              </Button>
            </div>
          )}
        />
      </form>
    </div>
  );
};

export default CreateAccountForm;
