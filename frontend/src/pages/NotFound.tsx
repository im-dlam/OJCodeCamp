import React, { type ReactElement } from "react";
import "./NotFound.css";

const NotFound: React.FC = (): ReactElement => {

  return (
    <main className="od-page error-viewport">
      <div className="od-container error-center">
        <div className="vector-static">
          <div className="search-circle">
            <div className="search-handle"></div>
            <div className="search-void"></div>
          </div>
        </div>

        <div className="error-content">
          <div className="error-meta">ERROR 404</div>
          <h1 className="error-heading">Không tìm thấy trang</h1>
          <p className="error-subtext">Yêu cầu của bạn không khớp với bất kỳ dữ liệu nào trong hệ thống. Vui lòng kiểm tra lại đường dẫn hoặc trở về Dashboard.</p>

          <div className="error-actions">
            <button
              className="od-btn-primary"
              style={{ justifyContent: "center" }}
              onClick={() => (window.location.href = "/")}
            >
              Trở về trang chính
            </button>

            <button
              className="od-btn-outline"
              onClick={() => window.history.back()}
            >
                Quay lại
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotFound;