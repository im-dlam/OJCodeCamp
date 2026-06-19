import {  CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useFetchSubmit } from '../../../hooks/useSubmission';


export function SubmissionsPanel({ problemId }: { problemId: number }) {
  const { data, isLoading, isError } = useFetchSubmit(problemId.toString(), 20); 

  if (isLoading) return <div style={{ color: '#8c8c8c', padding: '16px' }}>Đang tải lịch sử nộp bài...</div>;
  if (isError) return <div style={{ color: '#ef4444', padding: '16px' }}>Lỗi tải dữ liệu.</div>;

  const submissions = data?.data || [];

  return (
    <div className="submissions-container">
      {submissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>Bạn chưa có lần nộp nào cho bài này.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr>
              <th style={{ color: '#8c8c8c', fontWeight: 500, padding: '10px 8px', borderBottom: '1px solid #333' }}>Trạng thái</th>
              <th style={{ color: '#8c8c8c', fontWeight: 500, padding: '10px 8px', borderBottom: '1px solid #333' }}>Ngôn ngữ</th>
              <th style={{ color: '#8c8c8c', fontWeight: 500, padding: '10px 8px', borderBottom: '1px solid #333' }}>Thời gian</th>
              <th style={{ color: '#8c8c8c', fontWeight: 500, padding: '10px 8px', borderBottom: '1px solid #333' }}>Bộ nhớ</th>
              <th style={{ color: '#8c8c8c', fontWeight: 500, padding: '10px 8px', borderBottom: '1px solid #333' }}>Lúc nộp</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((sub: any) => {
              const isAccepted = sub.status === "Accepted";
              return (
                <tr key={sub.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                  <td style={{ padding: '12px 8px' }}>
                    {isAccepted ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#2cbb5d' }}>
                        <CheckCircle2 size={14} /> Accepted
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#ef4743' }}>
                        <XCircle size={14} /> {sub.status || "Wrong Answer"}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ backgroundColor: '#333', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', color: '#d1d5db' }}>
                      {sub.language}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} style={{ color: '#8c8c8c' }} />
                    {sub.execution_time ? `${sub.execution_time} ms` : "N/A"}
                  </td>
                  <td style={{ padding: '12px 8px', color: '#e5e7eb' }}>
                    {sub.memory_used ? `${sub.memory_used} MB` : "N/A"}
                  </td>
                  <td style={{ padding: '12px 8px', color: '#8c8c8c', fontSize: '13px' }}>
                    {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}