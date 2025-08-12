import React from 'react';
import Layout from '../../components/Layout';
import Head from 'next/head';
import { requireAuth } from '../../lib/requireAuth';

// Removed server-side auth check to prevent redirect loops
export const getServerSideProps = async () => {
  return { props: {} };
};

export default function CompleteGamePage() {
  return (
    <Layout>
      <Head>
        <title>Complete Game</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/fontawesome-free/css/all.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables-bs4/css/dataTables.bootstrap4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/datatables-responsive/css/responsive.bootstrap4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/dist/css/adminlte.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/overlayScrollbars/css/OverlayScrollbars.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/sweetalert2-theme-bootstrap-4/bootstrap-4.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/toastr/toastr.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/select2/css/select2.min.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/daterangepicker/daterangepicker.css" />
        <link rel="stylesheet" href="https://adminlite.s3.ap-south-1.amazonaws.com/adminlite/plugins/tempusdominus-bootstrap-4/css/tempusdominus-bootstrap-4.min.css" />
      </Head>
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1>Complete Game</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active">Complete Game</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                </div>
                <div className="card-body">
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center' }}><input type="checkbox" name="all" id="all" value="1" /></th>
                        <th>#</th>
                        <th>SNo</th>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Date Time</th>
                        <th>Match Type</th>
                        <th>Declare</th>
                        <th>Won By</th>
                        <th>Plus Minus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Table data will be added here later */}
                    </tbody>
                    <tfoot></tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
} 