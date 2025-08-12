import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { useEffect } from 'react'
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
dayjs.extend(weekday);
// import { ConfigProvider, theme as antdTheme } from 'antd';
// import 'antd/dist/antd.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Add AdminLTE scripts in correct order
    const loadScript = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        // Check if script is already loaded
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = (error) => {
          console.warn(`Failed to load script: ${src}`, error);
          resolve(); // Don't reject, just warn
        };
        document.body.appendChild(script);
      });
    };

    const initializeAdminLTE = async () => {
      try {
        // 1. Load jQuery first
        await loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/jquery/jquery.min.js');
        
        // 2. Load Bootstrap after jQuery
        await loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/bootstrap/js/bootstrap.bundle.min.js');
        
        // 3. Load DataTables scripts in order
        await loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables/jquery.dataTables.min.js');
        await loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables-bs4/js/dataTables.bootstrap4.min.js');
        await loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables-responsive/js/dataTables.responsive.min.js');
        await loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables-responsive/js/responsive.bootstrap4.min.js');
        
        // 4. Load other utility scripts
        await Promise.all([
          loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/daterangepicker/daterangepicker.js'),
          loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/moment/moment.min.js'),
          loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/tempusdominus-bootstrap-4/js/tempusdominus-bootstrap-4.min.js'),
          loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/toastr/toastr.min.js')
        ]);
        
        // 5. Load AdminLTE last
        await loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/dist/js/adminlte.min.js');
        await loadScript('https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/dist/js/demo.js');

        // Initialize AdminLTE after scripts are loaded
        if ((window as any).AdminLTE) {
          try {
            (window as any).AdminLTE.init();
          } catch (error) {
            console.warn('AdminLTE initialization failed:', error);
          }
        }

        // Add AdminLTE classes
        document.body.classList.add('text-sm');
        
        // Set site name
        const hostname = window.location.hostname;
        const siteName = hostname.split(".")[1]?.toUpperCase() || 'SITE';
        document.title = siteName;
        
        const siteNameElement = document.getElementById('siteName');
        if (siteNameElement) {
          siteNameElement.textContent = hostname;
        }
        
        const brandNameElement = document.getElementById('brandName');
        if (brandNameElement) {
          brandNameElement.textContent = siteName;
        }

        // AdminLTE initialized successfully
        console.log('AdminLTE scripts loaded successfully');
      } catch (error) {
        console.error('Error loading AdminLTE scripts:', error);
      }
    };

    initializeAdminLTE();
  }, []);

  return <Component {...pageProps} />
} 
