import { theme } from '../theme';
import { palette } from '../palette';
import { components } from '../components';

describe('Theme Configuration', () => {
  describe('Palette', () => {
    it('should have correct primary colors', () => {
      expect(theme.palette.primary.main).toBe('#2E7D32');
      expect(theme.palette.primary.light).toBe('#4CAF50');
      expect(theme.palette.primary.dark).toBe('#1B5E20');
      expect(theme.palette.primary.contrastText).toBe('#FFFFFF');
    });

    it('should have correct secondary colors', () => {
      expect(theme.palette.secondary.main).toBe('#1976D2');
      expect(theme.palette.secondary.light).toBe('#42A5F5');
      expect(theme.palette.secondary.dark).toBe('#1565C0');
      expect(theme.palette.secondary.contrastText).toBe('#FFFFFF');
    });

    it('should have proper background colors', () => {
      expect(theme.palette.background.default).toBe('#F8F9FA');
      expect(theme.palette.background.paper).toBe('#FFFFFF');
    });

    it('should have proper text colors', () => {
      expect(theme.palette.text.primary).toBe('rgba(0, 0, 0, 0.87)');
      expect(theme.palette.text.secondary).toBe('rgba(0, 0, 0, 0.6)');
      expect(theme.palette.text.disabled).toBe('rgba(0, 0, 0, 0.38)');
    });

    it('should have proper error colors', () => {
      expect(theme.palette.error.main).toBe('#D32F2F');
      expect(theme.palette.error.light).toBe('#EF5350');
      expect(theme.palette.error.dark).toBe('#C62828');
    });

    it('should have proper warning colors', () => {
      expect(theme.palette.warning.main).toBe('#ED6C02');
      expect(theme.palette.warning.light).toBe('#FF9800');
      expect(theme.palette.warning.dark).toBe('#E65100');
    });
  });

  describe('Typography', () => {
    it('should have correct font family', () => {
      expect(theme.typography.fontFamily).toContain('Inter');
      expect(theme.typography.fontFamily).toContain('Roboto');
      expect(theme.typography.fontFamily).toContain('Arial');
    });

    it('should have proper heading configurations', () => {
      expect(theme.typography.h1.fontSize).toBe('2.5rem');
      expect(theme.typography.h1.fontWeight).toBe(700);
      expect(theme.typography.h1.lineHeight).toBe(1.2);
      
      expect(theme.typography.h2.fontSize).toBe('2rem');
      expect(theme.typography.h2.fontWeight).toBe(700);
      expect(theme.typography.h2.lineHeight).toBe(1.3);
      
      expect(theme.typography.h3.fontSize).toBe('1.75rem');
      expect(theme.typography.h3.fontWeight).toBe(600);
    });

    it('should have proper body text configurations', () => {
      expect(theme.typography.body1.fontSize).toBe('1rem');
      expect(theme.typography.body1.lineHeight).toBe(1.5);
      
      expect(theme.typography.body2.fontSize).toBe('0.875rem');
      expect(theme.typography.body2.lineHeight).toBe(1.57);
    });

    it('should have proper button text configuration', () => {
      expect(theme.typography.button.textTransform).toBe('none');
      expect(theme.typography.button.fontWeight).toBe(600);
    });
  });

  describe('Components', () => {
    it('should have proper button configurations', () => {
      const buttonStyles = components.MuiButton?.styleOverrides;
      expect(buttonStyles?.root?.borderRadius).toBe(8);
      expect(buttonStyles?.root?.textTransform).toBe('none');
      expect(buttonStyles?.root?.fontWeight).toBe(600);
      expect(buttonStyles?.contained?.boxShadow).toBe('none');
    });

    it('should have proper card configurations', () => {
      const cardStyles = components.MuiCard?.styleOverrides;
      expect(cardStyles?.root?.borderRadius).toBe(12);
      expect(cardStyles?.root?.boxShadow).toBe('0px 2px 4px rgba(0, 0, 0, 0.05)');
    });

    it('should have proper text field configurations', () => {
      const textFieldProps = components.MuiTextField?.defaultProps;
      const textFieldStyles = components.MuiTextField?.styleOverrides;
      
      expect(textFieldProps?.variant).toBe('outlined');
      expect(textFieldProps?.size).toBe('small');
      expect(textFieldStyles?.root?.['& .MuiOutlinedInput-root']?.borderRadius).toBe(8);
    });

    it('should have proper table configurations', () => {
      const tableHeadStyles = components.MuiTableHead?.styleOverrides;
      const tableCellStyles = components.MuiTableCell?.styleOverrides;
      
      expect(tableHeadStyles?.root?.['& .MuiTableCell-root']?.fontWeight).toBe(600);
      expect(tableCellStyles?.root?.borderBottom).toBe('1px solid rgba(0, 0, 0, 0.06)');
    });
  });

  describe('Shape and Shadows', () => {
    it('should have correct border radius', () => {
      expect(theme.shape.borderRadius).toBe(8);
    });

    it('should have proper shadow configurations', () => {
      expect(theme.shadows[0]).toBe('none');
      expect(theme.shadows[1]).toContain('rgba(0,0,0,0.05)');
      expect(theme.shadows[2]).toContain('rgba(0,0,0,0.05)');
      expect(theme.shadows[3]).toContain('rgba(0,0,0,0.05)');
      expect(theme.shadows[4]).toContain('rgba(0,0,0,0.05)');
    });
  });
}); 