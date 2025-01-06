import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  TextFieldProps,
  SelectProps,
} from '@mui/material';
import React from 'react';

interface BaseFormFieldProps {
  name: string;
  label: string;
  error?: string;
  required?: boolean;
}

interface TextFormFieldProps extends BaseFormFieldProps {
  type: 'text' | 'number' | 'url' | 'date';
  value: string | undefined;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  textFieldProps?: Partial<TextFieldProps>;
}

interface SelectFormFieldProps extends BaseFormFieldProps {
  type: 'select';
  value: string | undefined;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  selectProps?: Partial<SelectProps>;
}

interface ObjectFormFieldProps extends BaseFormFieldProps {
  type: 'object';
  value: Record<string, unknown> | undefined;
  onChange: (value: Record<string, unknown>) => void;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean';
  }>;
}

type FormFieldProps = TextFormFieldProps | SelectFormFieldProps | ObjectFormFieldProps;

export function FormField(props: FormFieldProps) {
  const { name, label, error, required } = props;

  if (props.type === 'select') {
    const { value, onChange, options, selectProps } = props;
    return (
      <FormControl
        fullWidth
        error={!!error}
        required={required}
        variant="outlined"
        sx={{ mb: 2 }}
      >
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          label={label}
          onChange={(e) => onChange(e.target.value as string)}
          {...selectProps}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    );
  }

  if (props.type === 'object') {
    const { value, onChange, fields } = props;
    return (
      <FormControl
        fullWidth
        error={!!error}
        required={required}
        variant="outlined"
        sx={{ mb: 2 }}
      >
        <InputLabel shrink>{label}</InputLabel>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {fields.map((field) => (
            <TextField
              key={field.name}
              fullWidth
              label={field.label}
              value={
                field.type === 'boolean'
                  ? value?.[field.name]
                    ? 'Yes'
                    : 'No'
                  : value?.[field.name] ?? ''
              }
              onChange={(e) => {
                const newValue = { ...value } || {};
                if (field.type === 'boolean') {
                  newValue[field.name] = e.target.value === 'Yes';
                } else if (field.type === 'number') {
                  newValue[field.name] = Number(e.target.value);
                } else {
                  newValue[field.name] = e.target.value;
                }
                onChange(newValue);
              }}
              select={field.type === 'boolean'}
              type={field.type === 'number' ? 'number' : 'text'}
            >
              {field.type === 'boolean' && [
                <MenuItem key="true" value="Yes">
                  Yes
                </MenuItem>,
                <MenuItem key="false" value="No">
                  No
                </MenuItem>,
              ]}
            </TextField>
          ))}
        </Stack>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    );
  }

  const { value, onChange, multiline, rows, textFieldProps } = props;
  return (
    <TextField
      fullWidth
      name={name}
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={!!error}
      helperText={error}
      required={required}
      type={props.type}
      multiline={multiline}
      rows={rows}
      variant="outlined"
      sx={{ mb: 2 }}
      {...textFieldProps}
    />
  );
}
