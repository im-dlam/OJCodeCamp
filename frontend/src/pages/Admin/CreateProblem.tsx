import React, { useRef, useState } from 'react';
import { useForm, FormProvider, useFormContext, useFieldArray } from 'react-hook-form';
import { useCreateProblem } from '../../hooks/useAdminProblems';
import type { ProblemCreatePayload } from '../../types';
import { ChevronRight, ChevronLeft, Plus, Trash2, Save, FileText, Settings, List, ShieldAlert, FileArchive, FileJson, ClipboardType, HelpCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import JSZip from 'jszip';
import './CreateProblem.css';

const Step1General = () => {
  // fix: sử dụng any để mở rộng thêm field ảo (tagsString, customCategory) không có trong ProblemCreatePayload gốc
  const { register, watch } = useFormContext<any>();
  
  // feature: theo dõi giá trị category để hiển thị input nhập tay nếu chọn "Khác"
  const selectedCategory = watch('category');
  
  return (
    <div className="admin-step-container">
      <h2 className="step-title"><Settings size={20}/> Thông tin cơ bản</h2>
      <div className="form-grid">
        <div className="form-group">
          <label>Tiêu đề bài toán</label>
          <input {...register('title', { required: true })} placeholder="VD: Cộng Hai Số" />
        </div>
        
        <div className="form-group">
          <label>Endpoint (URL-friendly)</label>
          <input {...register('endpoint', { required: true })} placeholder="VD: cong-hai-so" />
        </div>

        {/* feature: Select danh mục soạn sẵn + nhập tay */}
        <div className="form-group">
          <label>Danh mục</label>
          <select {...register('category', { required: true })}>
            <option value="Toán học">Toán học</option>
            <option value="Mảng">Mảng</option>
            <option value="Chuỗi">Chuỗi</option>
            <option value="Quy hoạch động">Quy hoạch động</option>
            <option value="Đồ thị">Đồ thị</option>
            <option value="Khác">Khác...</option>
          </select>
          {selectedCategory === 'Khác' && (
            <input 
              {...register('customCategory')} 
              placeholder="Nhập danh mục, cách nhau bằng dấu phẩy (VD: Graph, Tree)" 
              style={{ marginTop: '8px' }}
            />
          )}
        </div>

        <div className="form-group">
          <label>Độ khó</label>
          <select {...register('difficulty')}>
            <option value="Dễ">Dễ</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Khó">Khó</option>
          </select>
        </div>

        {/* feature: Input Tags dưới dạng chuỗi */}
        <div className="form-group">
          <label>Tags</label>
          <input {...register('tagsString')} placeholder="Nhập tags, cách nhau bằng dấu phẩy (VD: math, array)" />
        </div>

        <div className="form-group">
          <label>Điểm số (Point)</label>
          <input type="number" {...register('point', { valueAsNumber: true })} defaultValue={10} />
        </div>
      </div>
    </div>
  );
};

const Step2Description = () => {
  const { register } = useFormContext<ProblemCreatePayload>();
  
  return (
    <div className="admin-step-container">
      <h2 className="step-title"><FileText size={20}/> Nội dung đề bài</h2>
      <div className="form-group">
        <label>Mô tả chi tiết (Hỗ trợ Markdown)</label>
        <textarea 
          {...register('description', { required: true })} 
          rows={12} 
          placeholder="Nhập đề bài vào đây..."
        />
      </div>
    </div>
  );
};

const Step3Examples = () => {
  const { control, register } = useFormContext<ProblemCreatePayload>();
  
  const { fields: exFields, append: exAppend, remove: exRemove } = useFieldArray({ control, name: 'examples' });
  const { fields: conFields, append: conAppend, remove: conRemove } = useFieldArray({ control, name: 'constraints' });

  return (
    <div className="admin-step-container">
      <h2 className="step-title"><List size={20}/> Ví dụ & Giới hạn</h2>
      
      <div className="dynamic-section">
        <div className="section-header">
          <h3>Các điều kiện giới hạn (Constraints)</h3>
          <button type="button" className="btn-add" onClick={() => conAppend({ constraint_text: '', order_index: conFields.length })}>
            <Plus size={16} /> Thêm giới hạn
          </button>
        </div>
        {conFields.map((field, index) => (
          <div key={field.id} className="dynamic-row">
            <input {...register(`constraints.${index}.constraint_text` as const)} placeholder="VD: 1 <= nums.length <= 10^4" />
            <input type="hidden" {...register(`constraints.${index}.order_index` as const)} value={index} />
            <button type="button" className="btn-remove" onClick={() => conRemove(index)}><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <hr className="divider"/>

      <div className="dynamic-section">
        <div className="section-header">
          <h3>Ví dụ minh họa (Hiển thị cho User)</h3>
          <button type="button" className="btn-add" onClick={() => exAppend({ input_text: '', output_text: '', explanation: '', order_index: exFields.length })}>
            <Plus size={16} /> Thêm Ví dụ
          </button>
        </div>
        {exFields.map((field, index) => (
          <div key={field.id} className="example-card">
            <div className="card-header">
              <h4>Ví dụ {index + 1}</h4>
              <button type="button" className="btn-remove" onClick={() => exRemove(index)}><Trash2 size={16} /></button>
            </div>
            <div className="form-group">
              <label>Input Text</label>
              <textarea {...register(`examples.${index}.input_text` as const)} rows={2} />
            </div>
            <div className="form-group">
              <label>Output Text</label>
              <textarea {...register(`examples.${index}.output_text` as const)} rows={2} />
            </div>
            <div className="form-group">
              <label>Giải thích (Tùy chọn)</label>
              <textarea {...register(`examples.${index}.explanation` as const)} rows={2} />
            </div>
            <input type="hidden" {...register(`examples.${index}.order_index` as const)} value={index} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Step4Testcases = () => {
  const { control, register } = useFormContext<ProblemCreatePayload>();
  const { fields, append, remove } = useFieldArray({ control, name: 'test_cases' });
  
  const fileJsonRef = useRef<HTMLInputElement>(null);
  const fileZipRef = useRef<HTMLInputElement>(null);
  
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const parseAndAppendJSON = (data: any) => {
    if (Array.isArray(data)) {
      const formattedTestcases = data.map(tc => ({
        input_text: String(tc.input_text || ''),
        output_text: String(tc.output_text || ''),
        is_hidden: tc.is_hidden !== undefined ? Boolean(tc.is_hidden) : true
      }));
      append(formattedTestcases);
      return true;
    }
    return false;
  };

  const handleJsonUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        if (!parseAndAppendJSON(parsedData)) {
          alert('Định dạng file không hợp lệ. Cần mảng object JSON.');
        }
      } catch (error) {
        alert('Lỗi khi đọc file JSON. Vui lòng kiểm tra lại cú pháp.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  const handlePasteSubmit = () => {
    try {
      const parsedData = JSON.parse(jsonText);
      if (parseAndAppendJSON(parsedData)) {
        setJsonText('');
        setShowPasteArea(false);
      } else {
        alert('Định dạng JSON không hợp lệ. Cần mảng object JSON.');
      }
    } catch (error) {
      alert('Cú pháp JSON không hợp lệ.');
    }
  };

  const handleZipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);
      const fileNames = Object.keys(zip.files);
      const testcaseMap: Record<string, { input_text?: string; output_text?: string }> = {};

      for (const fileName of fileNames) {
        if (zip.files[fileName].dir) continue;

        const content = await zip.files[fileName].async('string');
        const lowerName = fileName.toLowerCase();
        
        const match = lowerName.match(/\d+/);
        const key = match ? match[0] : lowerName.replace(/[^a-z0-9]/g, '');

        if (!testcaseMap[key]) testcaseMap[key] = {};

        if (lowerName.includes('in')) {
          testcaseMap[key].input_text = content.trim();
        } else if (lowerName.includes('out') || lowerName.includes('ans')) {
          testcaseMap[key].output_text = content.trim();
        }
      }

      const validTestcases = Object.values(testcaseMap)
        .filter(tc => tc.input_text !== undefined && tc.output_text !== undefined)
        .map(tc => ({
          input_text: tc.input_text!,
          output_text: tc.output_text!,
          is_hidden: true 
        }));

      if (validTestcases.length > 0) {
        append(validTestcases);
        alert(`Đã thêm thành công ${validTestcases.length} testcases từ file ZIP.`);
      } else {
        alert('Không tìm thấy cặp file input/output nào hợp lệ trong ZIP. Đảm bảo tên file chứa "in" và "out" cùng số thứ tự.');
      }
    } catch (error) {
      alert('Lỗi khi đọc file ZIP. Vui lòng kiểm tra lại.');
    }
    event.target.value = '';
  };

  return (
    <div className="admin-step-container">
      <h2 className="step-title"><ShieldAlert size={20}/> Testcases (Hệ thống chấm)</h2>
      
      <div className="dynamic-section">
        <div className="section-header">
          <h3>Dữ liệu đầu vào / đầu ra ẩn</h3>
          
          <div className="action-group" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className="btn-secondary" onClick={() => fileZipRef.current?.click()}>
              <FileArchive size={16} /> Up .ZIP
            </button>
            <input type="file" accept=".zip" ref={fileZipRef} style={{ display: 'none' }} onChange={handleZipUpload} />

            <button type="button" className="btn-secondary" onClick={() => fileJsonRef.current?.click()}>
              <FileJson size={16} /> Up .JSON
            </button>
            <input type="file" accept=".json" ref={fileJsonRef} style={{ display: 'none' }} onChange={handleJsonUpload} />

            <button type="button" className="btn-secondary" onClick={() => { setShowPasteArea(!showPasteArea); setShowHelp(false); }}>
              <ClipboardType size={16} /> Paste JSON
            </button>
            
            <button type="button" className="btn-secondary" onClick={() => { setShowHelp(!showHelp); setShowPasteArea(false); }}>
              <HelpCircle size={16} /> Hướng dẫn
            </button>

            <button type="button" className="btn-add" onClick={() => append({ input_text: '', output_text: '', is_hidden: true })}>
              <Plus size={16} /> Thêm thủ công
            </button>
          </div>
        </div>

        {showHelp && (
          <div className="help-area-container" style={{ marginBottom: '16px', padding: '20px', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px' }}>Hướng dẫn định dạng file Import</h4>
            
            <div style={{ marginBottom: '20px' }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>1. Định dạng file .ZIP</strong>
              <ul style={{ margin: '0 0 0 20px', padding: 0, fontSize: '14px', lineHeight: '1.6' }}>
                <li>Nén trực tiếp các file text vào file <code>.zip</code>.</li>
                <li>Tên file bắt buộc phải chứa <strong>chữ số</strong> để hệ thống ghép cặp Input/Output.</li>
                <li>File Input phải có chữ <code>in</code> trong tên (VD: <code>test1.in</code>, <code>input_02.txt</code>).</li>
                <li>File Output phải có chữ <code>out</code> hoặc <code>ans</code> trong tên (VD: <code>test1.out</code>, <code>output_02.txt</code>).</li>
              </ul>
            </div>

            <div>
              <strong style={{ display: 'block', marginBottom: '8px' }}>2. Định dạng file .JSON (hoặc Paste)</strong>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Cấu trúc file phải là một mảng (Array) chứa các object như sau:</p>
              <pre style={{ background: '#020617', padding: '16px', borderRadius: '6px', fontSize: '13px', overflowX: 'auto', border: '1px solid #334155' }}>
{`[
  {
    "input_text": "1 2",
    "output_text": "3",
    "is_hidden": true
  },
  {
    "input_text": "5 5",
    "output_text": "10",
    "is_hidden": false
  }
]`}
              </pre>
            </div>
          </div>
        )}

        {showPasteArea && (
          <div className="paste-area-container" style={{ marginBottom: '16px', padding: '20px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 500 }}>Dán mảng JSON testcases vào đây:</label>
            <textarea 
              rows={8} 
              value={jsonText} 
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={'[\n  { "input_text": "1 2", "output_text": "3", "is_hidden": true }\n]'}
              style={{ width: '100%', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" className="btn-primary" onClick={handlePasteSubmit}>Parse & Thêm</button>
              <button type="button" className="btn-secondary" onClick={() => setShowPasteArea(false)}>Hủy</button>
            </div>
          </div>
        )}
        
        {fields.length === 0 && !showPasteArea && !showHelp && (
          <p className="empty-msg">Chưa có testcase nào. Sử dụng các nút bên trên để import hàng loạt hoặc thêm thủ công.</p>
        )}
        
        {fields.map((field, index) => (
          <div key={field.id} className="testcase-row">
            <div className="tc-col">
              <label>Input {index + 1}</label>
              <textarea {...register(`test_cases.${index}.input_text` as const)} rows={3} />
            </div>
            <div className="tc-col">
              <label>Expected Output {index + 1}</label>
              <textarea {...register(`test_cases.${index}.output_text` as const)} rows={3} />
            </div>
            <div className="tc-action">
              <label>Ẩn?</label>
              <input type="checkbox" {...register(`test_cases.${index}.is_hidden` as const)} defaultChecked={true} />
              <button type="button" className="btn-remove" onClick={() => remove(index)}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function CreateProblem() {
  const [step, setStep] = useState(1);
  const { mutate: createProblem, isPending } = useCreateProblem();

  // feature: thêm các field ảo tagsString và customCategory vào defaultValues
  const methods = useForm<any>({
    defaultValues: {
      endpoint: "", title: "", difficulty: "Dễ", category: "Mảng", customCategory: "",
      description: "", point: 10, examples: [], constraints: [], 
      tags: [], tagsString: "", test_cases: []
    }
  });

  const onSubmit = (data: any) => {
    if (step !== 4) return;

    const payload = { ...data };

    // feature: xử lý tags - tách chuỗi ngăn cách bởi dấu phẩy thành List (Array)
    if (payload.tagsString) {
      payload.tags = payload.tagsString.split(',').map((t: string) => t.trim()).filter(Boolean);
    } else {
      payload.tags = [];
    }
    delete payload.tagsString; // Dọn dẹp payload trước khi submit

    // feature: xử lý category - nếu chọn "Khác", tách chuỗi custom thành List. Nếu không, chuyển category mặc định thành List.
    if (payload.category === 'Khác') {
      payload.category = payload.customCategory 
        ? payload.customCategory.split(',').map((c: string) => c.trim()).filter(Boolean)
        : [];
    } else {
      payload.category = payload.category ? [payload.category] : [];
    }
    delete payload.customCategory; // Dọn dẹp payload trước khi submit

    // fix: Ép kiểu lại thành ProblemCreatePayload khi đẩy vào hook
    createProblem(payload as ProblemCreatePayload, {
      onSuccess: () => {
        alert("Tạo bài toán thành công!");
        methods.reset();
        setStep(1);
      },
      onError: (err) => {
        alert(err.message);
      }
    });
  };

  const nextStep = async () => {
    const isValid = await methods.trigger(); 
    if (isValid) setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  return (
    <div className="admin-layout">
      <Navbar />
      <div className="admin-container">
        
        <div className="admin-header">
          <h1>Tạo Bài Tập Mới</h1>
          <p>Thiết lập thông số, đề bài và dữ liệu chấm tự động.</p>
        </div>

        <div className="stepper">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className={`step-item ${step >= num ? 'active' : ''}`}>
              <div className="step-circle">{num}</div>
              <div className="step-label">
                {num === 1 ? 'Thông tin' : num === 2 ? 'Đề bài' : num === 3 ? 'Ví dụ' : 'Testcases'}
              </div>
            </div>
          ))}
        </div>

        <div className="admin-card">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} onKeyDown={handleKeyDown}>
              
              <div className="step-content">
                {step === 1 && <Step1General />}
                {step === 2 && <Step2Description />}
                {step === 3 && <Step3Examples />}
                {step === 4 && <Step4Testcases />}
              </div>

              <div className="step-actions">
                <button type="button" className="btn-secondary" onClick={prevStep} disabled={step === 1}>
                  <ChevronLeft size={18} /> Quay lại
                </button>
                
                {step < 4 ? (
                  <button 
                    key="btn-next" 
                    type="button" 
                    className="btn-primary" 
                    onClick={nextStep}
                  >
                    Tiếp tục <ChevronRight size={18} />
                  </button>
                ) : (
                  <button 
                    key="btn-submit"
                    type="submit"    
                    className="btn-success" 
                    disabled={isPending}
                  >
                    {isPending ? 'Đang lưu...' : <><Save size={18} /> Hoàn tất & Đăng bài</>}
                  </button>
                )}
              </div>

            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
}