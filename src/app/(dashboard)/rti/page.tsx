'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import SignaturePad from 'react-signature-canvas';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CircleDashed, Download, Eraser, FileText } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

const rtiSchema = z.object({
    department: z.string().min(2, "Department/Public Authority name is required"),
    applicantName: z.string().min(2, "Applicant Name is required"),
    fatherSpouseName: z.string().min(2, "Father/Spouse Name is required"),
    permanentAddress: z.string().min(5, "Permanent Address is required"),
    correspondenceAddress: z.string().min(5, "Correspondence Address is required"),
    subjectMatter: z.string().min(5, "Subject Matter is required"),
    period: z.string().min(2, "Period is required"),
    details: z.string().min(10, "Specific Details are required"),
    deliveryMode: z.enum(["Post", "In Person"], { required_error: "Select delivery mode" }),
    postType: z.string().optional(),
    voluntaryDisclosure: z.string().optional(),
    agreePayFee: z.enum(["Yes", "No"], { required_error: "Please confirm fee payment" }),
    feeDepositDetails: z.string().optional(),
    isBPL: z.enum(["Yes", "No"], { required_error: "Select BPL status" }),
    bplCardDetails: z.string().optional(),
});

type RtiFormValues = z.infer<typeof rtiSchema>;

export default function RtiPage() {
    const [isGenerating, setIsGenerating] = useState(false);
    const sigPadRef = useRef<SignaturePad>(null);
    const [pdfData, setPdfData] = useState<RtiFormValues | null>(null);
    const pdfTemplateRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    const form = useForm<RtiFormValues>({
        resolver: zodResolver(rtiSchema),
        defaultValues: {
            department: '',
            applicantName: '',
            fatherSpouseName: '',
            permanentAddress: '',
            correspondenceAddress: '',
            subjectMatter: '',
            period: '',
            details: '',
            deliveryMode: 'Post',
            agreePayFee: 'Yes',
            isBPL: 'No',
        }
    });

    const clearSignature = () => {
        sigPadRef.current?.clear();
    };

    useEffect(() => {
        if (pdfData && pdfTemplateRef.current) {
            const generate = async () => {
                try {
                    const canvas = await html2canvas(pdfTemplateRef.current, {
                        scale: 2,
                        useCORS: true,
                        logging: false,
                        windowWidth: 800
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.6);
                    const pdf = new jsPDF('p', 'mm', 'a4');
                    
                    const imgProps = pdf.getImageProperties(imgData);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    const pageHeight = pdf.internal.pageSize.getHeight();

                    let heightLeft = pdfHeight;
                    let position = 0;

                    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;

                    while (heightLeft > 0) {
                        position -= pageHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                        heightLeft -= pageHeight;
                    }

                    pdf.save(`RTI-Application-${pdfData.applicantName.replace(/\s+/g, '-')}.pdf`);
                } catch (error) {
                    console.error("PDF Generation Error:", error);
                } finally {
                    setPdfData(null);
                    setIsGenerating(false);
                }
            };
            generate();
        }
    }, [pdfData]);

    const handleGeneratePdf = (values: RtiFormValues) => {
        setIsGenerating(true);
        setPdfData(values);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto px-4 md:px-0 pb-12">
            <Card className="border-t-4 border-t-primary">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-2xl">{t('rti.title')}</CardTitle>
                    </div>
                    <CardDescription>
                        {t('rti.description')}
                    </CardDescription>
                </CardHeader>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleGeneratePdf)} className="space-y-8">
                    
                    {/* 1. Public Authority & Applicant Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('rti.sections.1')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="department" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>{t('rti.fields.department')}</FormLabel><FormControl><Input placeholder={t('rti.fields.departmentPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="applicantName" render={({ field }) => (<FormItem><FormLabel>{t('rti.fields.applicantName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="fatherSpouseName" render={({ field }) => (<FormItem><FormLabel>{t('rti.fields.fatherSpouseName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="permanentAddress" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>{t('rti.fields.permanentAddress')}</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="correspondenceAddress" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>{t('rti.fields.correspondenceAddress')}</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>

                    {/* 2. Information Solicited */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('rti.sections.2')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField control={form.control} name="subjectMatter" render={({ field }) => (<FormItem><FormLabel>{t('rti.fields.subjectMatter')}</FormLabel><FormControl><Input placeholder={t('rti.fields.subjectMatterPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="period" render={({ field }) => (<FormItem><FormLabel>{t('rti.fields.period')}</FormLabel><FormControl><Input placeholder={t('rti.fields.periodPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="details" render={({ field }) => (<FormItem><FormLabel>{t('rti.fields.details')}</FormLabel><FormControl><Textarea rows={6} placeholder={t('rti.fields.detailsPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="deliveryMode" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('rti.fields.deliveryMode')}</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder={t('rti.fields.deliveryModeOptions.select')} /></SelectTrigger></FormControl>
                                            <SelectContent><SelectItem value="Post">{t('rti.fields.deliveryModeOptions.post')}</SelectItem><SelectItem value="In Person">{t('rti.fields.deliveryModeOptions.inPerson')}</SelectItem></SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="postType" render={({ field }) => (<FormItem><FormLabel>{t('rti.fields.postType')}</FormLabel><FormControl><Input placeholder={t('rti.fields.postTypePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            
                            <FormField control={form.control} name="voluntaryDisclosure" render={({ field }) => (<FormItem><FormLabel>{t('rti.fields.voluntaryDisclosure')}</FormLabel><FormControl><Input placeholder={t('rti.fields.voluntaryDisclosurePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>

                    {/* 3. Fees & Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('rti.sections.3')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="isBPL" render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>{t('rti.fields.isBPL')}</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">{t('rti.fields.yes')}</FormLabel></FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">{t('rti.fields.no')}</FormLabel></FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="bplCardDetails" render={({ field }) => (<FormItem><FormLabel>{t('rti.fields.bplCardDetails')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="agreePayFee" render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>{t('rti.fields.agreePayFee')}</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">{t('rti.fields.yes')}</FormLabel></FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">{t('rti.fields.no')}</FormLabel></FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="feeDepositDetails" render={({ field }) => (<FormItem><FormLabel>{t('rti.fields.feeDepositDetails')}</FormLabel><FormControl><Input placeholder={t('rti.fields.feeDepositDetailsPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Signature */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('rti.sections.signature')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Label htmlFor="signature-pad">{t('rti.fields.signatureLabel')}</Label>
                            <div className="mt-2 border rounded-md bg-background w-full max-w-md">
                                <SignaturePad
                                    ref={sigPadRef}
                                    canvasProps={{ id: 'signature-pad', className: 'w-full h-[150px]' }}
                                />
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={clearSignature} className="mt-2">
                                <Eraser className="w-4 h-4 mr-2" />
                                {t('rti.fields.clearSignature')}
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={isGenerating} className="w-full md:w-auto">
                            {isGenerating ? <CircleDashed className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                            {isGenerating ? t('rti.generating') : t('rti.generateBtn')}
                        </Button>
                    </div>
                </form>
            </Form>

            {/* Hidden PDF Template */}
            <div className="absolute -left-[9999px] top-0 opacity-0 w-[800px]">
                {pdfData && (
                    <div ref={pdfTemplateRef} className="w-[800px] bg-white text-black font-['Noto_Sans_Devanagari'] text-[12pt] leading-relaxed text-justify p-[15mm]">
                        <style>{`
                            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap');
                            .rti-header { text-align: center; margin-bottom: 20px; }
                            .rti-title { font-weight: bold; text-decoration: underline; font-size: 14pt; margin-bottom: 5px; }
                            .rti-subtitle { font-weight: bold; font-size: 12pt; }
                            .rti-id { text-align: right; margin-bottom: 20px; font-size: 10pt; }
                            .rti-to { margin-bottom: 20px; font-weight: bold; line-height: 1.5; }
                            .rti-row { display: flex; margin-bottom: 12px; align-items: flex-start; }
                            .rti-num { width: 30px; font-weight: bold; flex-shrink: 0; }
                            .rti-label { width: 250px; font-weight: bold; flex-shrink: 0; }
                            .rti-value { flex-grow: 1; border-bottom: 1px dotted #000; padding-left: 5px; min-height: 20px; }
                            .rti-sub-row { display: flex; margin-left: 30px; margin-bottom: 8px; }
                            .rti-sub-label { width: 220px; }
                            .rti-multiline { white-space: pre-wrap; word-wrap: break-word; }
                            .rti-footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
                            .rti-signature-img { max-height: 50px; max-width: 150px; }
                            .rti-notes { margin-top: 30px; font-size: 9pt; border-top: 1px solid #000; padding-top: 10px; }
                            .rti-ack { margin-top: 40px; border-top: 2px dashed #000; padding-top: 20px; }
                        `}</style>

                        <div className="rti-header">
                            <div className="rti-title">{t('rti.pdf.title')}</div>
                            <div className="rti-subtitle">{t('rti.pdf.subtitle')}</div>
                        </div>

                        <div className="rti-id">
                            {t('rti.pdf.idNo')}<br/>
                            {t('rti.pdf.officeUse')}
                        </div>

                        <div className="rti-to">
                            {t('rti.pdf.to')}<br/>
                            {t('rti.pdf.pio')}<br/>
                            {t('rti.pdf.apio')}<br/>
                            <span style={{fontWeight: 'normal'}}>{pdfData.department}</span>
                        </div>

                        <div className="rti-row">
                            <div className="rti-num">1.</div>
                            <div className="rti-label">{t('rti.fields.applicantName')} :</div>
                            <div className="rti-value">{pdfData.applicantName}</div>
                        </div>

                        <div className="rti-row">
                            <div className="rti-num">2.</div>
                            <div className="rti-label">{t('rti.fields.fatherSpouseName')} :</div>
                            <div className="rti-value">{pdfData.fatherSpouseName}</div>
                        </div>

                        <div className="rti-row">
                            <div className="rti-num">3.</div>
                            <div className="rti-label">{t('rti.fields.permanentAddress')} :</div>
                            <div className="rti-value rti-multiline">{pdfData.permanentAddress}</div>
                        </div>

                        <div className="rti-row">
                            <div className="rti-num">4.</div>
                            <div className="rti-label">{t('rti.fields.correspondenceAddress')} :</div>
                            <div className="rti-value rti-multiline">{pdfData.correspondenceAddress}</div>
                        </div>

                        <div className="rti-row">
                            <div className="rti-num">5.</div>
                            <div className="rti-label">{t('rti.sections.2')} :</div>
                        </div>

                        <div className="rti-sub-row">
                            <div className="rti-num">a)</div>
                            <div className="rti-sub-label">{t('rti.fields.subjectMatter')} :</div>
                            <div className="rti-value">{pdfData.subjectMatter}</div>
                        </div>
                        <div className="rti-sub-row">
                            <div className="rti-num">b)</div>
                            <div className="rti-sub-label">{t('rti.fields.period')} :</div>
                            <div className="rti-value">{pdfData.period}</div>
                        </div>
                        <div className="rti-sub-row">
                            <div className="rti-num">c)</div>
                            <div className="rti-sub-label">{t('rti.fields.details')} :</div>
                        </div>
                        <div style={{ marginLeft: '60px', marginBottom: '15px', border: '1px solid #ccc', padding: '10px', minHeight: '80px' }} className="rti-multiline">
                            {pdfData.details}
                        </div>

                        <div className="rti-sub-row">
                            <div className="rti-num">d)</div>
                            <div className="rti-sub-label">{t('rti.fields.deliveryMode')} :</div>
                            <div className="rti-value">{pdfData.deliveryMode}</div>
                        </div>
                        <div className="rti-sub-row">
                            <div className="rti-num">e)</div>
                            <div className="rti-sub-label">{t('rti.fields.postType')} :</div>
                            <div className="rti-value">{pdfData.postType || 'N/A'}</div>
                        </div>

                        <div className="rti-row">
                            <div className="rti-num">6.</div>
                            <div className="rti-label">{t('rti.fields.voluntaryDisclosure')} :</div>
                            <div className="rti-value">{pdfData.voluntaryDisclosure || 'N/A'}</div>
                        </div>

                        <div className="rti-row">
                            <div className="rti-num">7.</div>
                            <div className="rti-label">{t('rti.fields.agreePayFee')} :</div>
                            <div className="rti-value">{pdfData.agreePayFee}</div>
                        </div>

                        <div className="rti-row">
                            <div className="rti-num">8.</div>
                            <div className="rti-label">{t('rti.fields.feeDepositDetails')} :</div>
                            <div className="rti-value">{pdfData.feeDepositDetails ? `Yes (${pdfData.feeDepositDetails})` : 'No'}</div>
                        </div>

                        <div className="rti-row">
                            <div className="rti-num">9.</div>
                            <div className="rti-label">{t('rti.fields.isBPL')} :</div>
                            <div className="rti-value">{pdfData.isBPL} {pdfData.isBPL === 'Yes' && pdfData.bplCardDetails ? `(Card: ${pdfData.bplCardDetails})` : ''}</div>
                        </div>

                        <div className="rti-footer">
                            <div>
                                {t('rti.pdf.place')} _________________<br/><br/>
                                {t('rti.pdf.date')} {new Date().toLocaleDateString()}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                {sigPadRef.current && !sigPadRef.current.isEmpty() && (
                                    <img src={sigPadRef.current.toDataURL()} alt="Signature" className="rti-signature-img" />
                                )}
                                <br/>
                                ____________________________<br/>
                                <strong>{t('rti.pdf.signatureApplicant')}</strong>
                            </div>
                        </div>

                        <div className="rti-notes">
                            {t('rti.pdf.note1')}<br/>
                            {t('rti.pdf.note2')}<br/>
                            {t('rti.pdf.note3')}
                        </div>

                        {/* Form B - Acknowledgement */}
                        <div className="rti-ack">
                            <div className="rti-header">
                                <div className="rti-title">FORM "B"</div>
                                <div className="rti-subtitle">[See rule 3(2)] Acknowledgement</div>
                            </div>
                            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                <strong>Office of the State Public Information Officer</strong>
                            </div>
                            <div className="rti-row">
                                <div style={{ width: '100%' }}>
                                    Received the application form from Mr/Ms <u>{pdfData.applicantName}</u><br/>
                                    Address <u>{pdfData.correspondenceAddress}</u><br/>
                                    Seeking information on <u>{pdfData.subjectMatter}</u><br/>
                                    Vide Diary No.: ____________________________ Dated: _________________________
                                </div>
                            </div>
                            <div className="rti-footer" style={{ marginTop: '20px' }}>
                                <div>Place: ___________<br/>Date: ___________</div>
                                <div style={{ textAlign: 'center' }}>
                                    ____________________________<br/>
                                    <strong>Full Name & Designation of PIO</strong><br/>
                                    (Seal)
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}