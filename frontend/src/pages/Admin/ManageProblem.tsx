// file: AdminProblems.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useProblems } from '../../hooks/useProblems';
import { 
  useUpdateProblem, 
  useDeleteProblem, 
  useAddProblemExample, 
  useaddProblemConstraint, 
  useAProblemTag 
} from '../../hooks/useAdminProblems';
import { problem_detail } from '../../api/problem.api'; 
import { toast } from 'react-hot-toast'; 

import type { ProblemPreview } from '../../types';
import { 
  Search, Edit, Trash2, Plus, X, 
  AlertTriangle, Save, FileText, List, Tags 
} from 'lucide-react';
import './ManageProblem.css';

export default function AdminProblems() {
  const { data, isLoading } = useProblems(100);
  const problems = data?.data || [];

  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; problem: ProblemPreview | null; activeTab: string }>({ isOpen: false, problem: null, activeTab: 'general' });
  const [isFetchingDetail, setIsFetchingDetail] = useState(false); // State để show loading khi fetch data chi tiết

  const { mutate: deleteProblem, isPending: isDeleting } = useDeleteProblem(deleteModal.id || 0);
  const { mutate: updateProblem, isPending: isUpdating } = useUpdateProblem(editModal.problem?.id || 0);
  const { mutate: addExample, isPending: isAddingExample } = useAddProblemExample(editModal.problem?.id || 0);
  const { mutate: addConstraint, isPending: isAddingConstraint } = useaddProblemConstraint(editModal.problem?.id || 0);
  const { mutate: addTag, isPending: isAddingTag } = useAProblemTag(editModal.problem?.id || 0);

  const [editForm, setEditForm] = useState({ title: '', difficulty: '', category: '', description: '', point: 0 });
  const [exForm, setExForm] = useState({ input_text: '', output_text: '', explanation: '', order_index: 1 });
  const [conForm, setConForm] = useState({ constraint_text: '', order_index: 1 });
  const [tagForm, setTagForm] = useState({ tag_name: '' });

  const filteredProblems = problems.filter((p: ProblemPreview) => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // fix: Sửa hàm mở modal thành bất đồng bộ (async), gọi API lấy detail trước khi show form
  const openEditModal = async (prob: ProblemPreview) => {
    // Mở modal trước và đặt state loading = true để user biết hệ thống đang xử lý
    setEditModal({ isOpen: true, problem: prob, activeTab: 'general' });
    setIsFetchingDetail(true);

    try {
      const res = await problem_detail(prob.endpoint);
      if (res.success && res.problem) {
        // Nạp dữ liệu cũ vào Form
        setEditForm({ 
          title: res.problem.title, 
          difficulty: res.problem.difficulty, 
          category: res.problem.category,
          description: res.problem.description || '', // Đã tự động load description cũ lên
          point: res.problem.point 
        });

        // Thiết lập order index gợi ý cho việc thêm mới (bằng độ dài mảng hiện tại + 1)
        setExForm({ ...exForm, order_index: res.problem.examples?.length + 1 || 1 });
        setConForm({ ...conForm, order_index: res.problem.constraints?.length + 1 || 1 });
      }
    } catch (error) {
      toast.error("Không thể tải thông tin chi tiết bài toán.");
    } finally {
      setIsFetchingDetail(false);
    }
  };

  const handleDelete = () => {
    if (!deleteModal.id) return;
    deleteProblem(undefined, {
      onSuccess: () => setDeleteModal({ isOpen: false, id: null })
    });
  };

  const handleUpdateGeneral = () => {
    updateProblem(editForm, {
      onSuccess: () => toast.success("Cập nhật thành công!")
    });
  };

  const handleAddExample = () => {
    addExample(exForm, {
      onSuccess: () => {
        toast.success("Thêm ví dụ thành công!");
        setExForm({ input_text: '', output_text: '', explanation: '', order_index: exForm.order_index + 1 });
      }
    });
  };

  const handleAddConstraint = () => {
    addConstraint(conForm, {
      onSuccess: () => {
        toast.success("Thêm giới hạn thành công!");

        setConForm({ constraint_text: '', order_index: conForm.order_index + 1 });
      }
    });
  };

  const handleAddTag = () => {
    addTag(tagForm, {
      onSuccess: () => {
        toast.success("Thêm Tag thành công!");
        setTagForm({ tag_name: '' });
      }
    });
  };

  return (
    <div className="ap-layout">
      <Navbar />
      <div className="ap-container">
        
        <div className="ap-header">
          <div>
            <h1>Quản lý Bài toán</h1>
            <p>Xem, sửa, xóa và quản lý chi tiết các bài toán trong hệ thống.</p>
          </div>
          <Link to="/admin/problems/create" className="ap-btn-primary" title="Tạo bài tập mới">
            <Plus size={16} /> Tạo bài toán mới
          </Link>
        </div>

        <div className="ap-toolbar">
          <div className="ap-search-box">
            <Search size={16} className="ap-icon-muted" />
            <input 
              type="text" 
              placeholder="Tìm kiếm bài toán..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="ap-table-wrapper">
          <table className="ap-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tiêu đề</th>
                <th>Danh mục</th>
                <th>Độ khó</th>
                <th>Điểm</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted">Đang tải dữ liệu...</td></tr>
              ) : filteredProblems.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted">Không tìm thấy bài toán nào.</td></tr>
              ) : (
                filteredProblems.map((prob: ProblemPreview) => (
                  <tr key={prob.id}>
                    <td className="text-muted">#{prob.id}</td>
                    <td className="font-medium text-light" title={prob.title}>{prob.title}</td>
                    <td><span className="ap-badge" title={prob.category}>{prob.category}</span></td>
                    <td>
                      <span className={`ap-diff ${prob.difficulty === 'Dễ' ? 'easy' : prob.difficulty === 'Trung bình' ? 'med' : 'hard'}`} title={prob.difficulty}>
                        {prob.difficulty === 'Dễ' ? 'Easy' : prob.difficulty === 'Trung bình' ? 'Medium' : 'Hard'}
                      </span>
                    </td>
                    <td className="font-mono text-success" title={`${prob.point} điểm`}>{prob.point}</td>
                    <td className="text-right">
                      <div className="ap-actions">
                        <button className="ap-btn-icon" onClick={() => openEditModal(prob)} title="Chỉnh sửa chi tiết">
                          <Edit size={16} />
                        </button>
                        <button className="ap-btn-icon danger" onClick={() => setDeleteModal({ isOpen: true, id: prob.id })} title="Xóa bài toán này">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {deleteModal.isOpen && (
          <div className="ap-modal-overlay">
            <div className="ap-modal-content ap-modal-sm">
              <div className="ap-modal-header border-none pb-0">
                <h3 className="text-danger flex items-center gap-2"><AlertTriangle size={18}/> Xác nhận xóa</h3>
                <button className="ap-btn-close" onClick={() => setDeleteModal({ isOpen: false, id: null })}><X size={18}/></button>
              </div>
              <div className="ap-modal-body">
                <p>Bạn có chắc chắn muốn xóa bài toán <strong>#{deleteModal.id}</strong> không? Hành động này không thể hoàn tác.</p>
              </div>
              <div className="ap-modal-footer">
                <button className="ap-btn-secondary" onClick={() => setDeleteModal({ isOpen: false, id: null })}>Hủy</button>
                <button className="ap-btn-danger" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Đang xóa...' : 'Xóa bài toán'}
                </button>
              </div>
            </div>
          </div>
        )}

        {editModal.isOpen && editModal.problem && (
          <div className="ap-modal-overlay">
            <div className="ap-modal-content">
              <div className="ap-modal-header">
                <h3>Chỉnh sửa: {editModal.problem.title}</h3>
                <button className="ap-btn-close" onClick={() => setEditModal({ isOpen: false, problem: null, activeTab: 'general' })}><X size={18}/></button>
              </div>
              
              <div className="ap-tabs">
                <button className={`ap-tab ${editModal.activeTab === 'general' ? 'active' : ''}`} onClick={() => setEditModal({...editModal, activeTab: 'general'})}><Edit size={14}/> Cơ bản</button>
                <button className={`ap-tab ${editModal.activeTab === 'examples' ? 'active' : ''}`} onClick={() => setEditModal({...editModal, activeTab: 'examples'})}><FileText size={14}/> Thêm Ví dụ</button>
                <button className={`ap-tab ${editModal.activeTab === 'constraints' ? 'active' : ''}`} onClick={() => setEditModal({...editModal, activeTab: 'constraints'})}><List size={14}/> Thêm Giới hạn</button>
                <button className={`ap-tab ${editModal.activeTab === 'tags' ? 'active' : ''}`} onClick={() => setEditModal({...editModal, activeTab: 'tags'})}><Tags size={14}/> Thêm Tag</button>
              </div>

              <div className="ap-modal-body">
                {/* ui: Hiển thị bộ đệm Loading Spinner khi đang fetch Data */}
                {isFetchingDetail ? (
                  <div className="flex items-center justify-center py-8 text-muted">
                    <span>Đang tải thông tin chi tiết...</span>
                  </div>
                ) : (
                  <>
                    {editModal.activeTab === 'general' && (
                      <div className="ap-form-grid">
                        <div className="ap-form-group">
                          <label>Tiêu đề</label>
                          <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} />
                        </div>
                        <div className="ap-form-group">
                          <label>Danh mục</label>
                          <input type="text" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} placeholder="VD: Array, Math" />
                        </div>
                        <div className="ap-form-group">
                          <label>Độ khó</label>
                          <select value={editForm.difficulty} onChange={e => setEditForm({...editForm, difficulty: e.target.value})}>
                            <option value="Dễ">Dễ</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Khó">Khó</option>
                          </select>
                        </div>
                        <div className="ap-form-group">
                          <label>Điểm số</label>
                          <input type="number" value={editForm.point} onChange={e => setEditForm({...editForm, point: Number(e.target.value)})} />
                        </div>
                        <div className="ap-form-group">
                          <label>Mô tả chi tiết (Markdown)</label>
                          {/* Đã tự động điền sẵn mô tả cũ */}
                          <textarea rows={10} value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                        </div>
                        <div className="ap-form-group mt-4">
                          <button className="ap-btn-primary w-full" onClick={handleUpdateGeneral} disabled={isUpdating}>
                            <Save size={16}/> {isUpdating ? 'Đang lưu...' : 'Cập nhật Thông tin'}
                          </button>
                        </div>
                      </div>
                    )}

                    {editModal.activeTab === 'examples' && (
                      <div className="ap-form-grid">
                        <div className="ap-form-group">
                          <label>Thứ tự hiển thị (Order Index)</label>
                          <input type="number" value={exForm.order_index} onChange={e => setExForm({...exForm, order_index: Number(e.target.value)})} />
                        </div>
                        <div className="ap-form-group">
                          <label>Input Text</label>
                          <textarea rows={2} value={exForm.input_text} onChange={e => setExForm({...exForm, input_text: e.target.value})} placeholder="VD: nums = [1,2], target = 3" />
                        </div>
                        <div className="ap-form-group">
                          <label>Output Text</label>
                          <textarea rows={2} value={exForm.output_text} onChange={e => setExForm({...exForm, output_text: e.target.value})} placeholder="VD: [0, 1]" />
                        </div>
                        <div className="ap-form-group">
                          <label>Giải thích (Tùy chọn)</label>
                          <textarea rows={2} value={exForm.explanation} onChange={e => setExForm({...exForm, explanation: e.target.value})} />
                        </div>
                        <button className="ap-btn-primary mt-2" onClick={handleAddExample} disabled={isAddingExample}>
                          <Plus size={16}/> {isAddingExample ? 'Đang thêm...' : 'Thêm Ví dụ mới'}
                        </button>
                      </div>
                    )}

                    {editModal.activeTab === 'constraints' && (
                      <div className="ap-form-grid">
                        <div className="ap-form-group">
                          <label>Thứ tự hiển thị (Order Index)</label>
                          <input type="number" value={conForm.order_index} onChange={e => setConForm({...conForm, order_index: Number(e.target.value)})} />
                        </div>
                        <div className="ap-form-group">
                          <label>Điều kiện giới hạn</label>
                          <input type="text" value={conForm.constraint_text} onChange={e => setConForm({...conForm, constraint_text: e.target.value})} placeholder="VD: 1 <= nums.length <= 10^4" />
                        </div>
                        <button className="ap-btn-primary mt-2" onClick={handleAddConstraint} disabled={isAddingConstraint}>
                          <Plus size={16}/> {isAddingConstraint ? 'Đang thêm...' : 'Thêm Giới hạn'}
                        </button>
                      </div>
                    )}

                    {editModal.activeTab === 'tags' && (
                      <div className="ap-form-grid">
                        <div className="ap-form-group">
                          <label>Tên Tag</label>
                          <input type="text" value={tagForm.tag_name} onChange={e => setTagForm({tag_name: e.target.value})} placeholder="VD: Array, Math, Dynamic Programming" />
                        </div>
                        <button className="ap-btn-primary mt-2" onClick={handleAddTag} disabled={isAddingTag}>
                          <Plus size={16}/> {isAddingTag ? 'Đang thêm...' : 'Thêm Tag'}
                        </button>
                      </div>
                    )}
                  </>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}