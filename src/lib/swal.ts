import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info') => {
  return MySwal.fire({
    title,
    text,
    icon,
    confirmButtonText: 'ตกลง',
    confirmButtonColor: '#0d6efd', // Bootstrap primary color
  });
};

export const showConfirm = (title: string, text: string, confirmText: string = 'ยืนยัน', cancelText: string = 'ยกเลิก') => {
  return MySwal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#0d6efd',
    cancelButtonColor: '#6c757d',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
};

export const showLoading = (title: string = 'กำลังประมวลผล...') => {
  return MySwal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      MySwal.showLoading();
    },
  });
};

export const closeSwal = () => {
  MySwal.close();
};

export default MySwal;
