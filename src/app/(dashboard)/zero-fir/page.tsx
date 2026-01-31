'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import SignaturePad from 'react-signature-canvas';

import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CircleDashed, Download, Eraser } from 'lucide-react';

const zeroFirSchema = z.object({
    informantName: z.string().min(1, "Name is required"),
    fatherHusbandName: z.string().min(1, "This field is required"),
    age: z.coerce.number().min(1, "Age is required"),
    gender: z.string().min(1, "Gender is required"),
    occupation: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    contactNumber: z.string().min(1, "Contact number is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    incidentDate: z.string().min(1, "Incident date is required"),
    incidentTime: z.string().min(1, "Incident time is required"),
    incidentPlace: z.string().min(1, "Place of incident is required"),
    offenseType: z.string().min(1, "Type of offense is required"),
    briefFacts: z.string().min(1, "Brief facts are required"),
    accusedDetails: z.string().optional(),
    witnessDetails: z.string().optional(),
});

type ZeroFirFormValues = z.infer<typeof zeroFirSchema>;

export default function ZeroFirPage() {
    const { t } = useLanguage();
    const [isGenerating, setIsGenerating] = useState(false);
    const sigPadRef = useRef<SignaturePad>(null);
    const [pdfData, setPdfData] = useState<ZeroFirFormValues | null>(null);
    const pdfTemplateRef = useRef<HTMLDivElement>(null);

    const form = useForm<ZeroFirFormValues>({
        resolver: zodResolver(zeroFirSchema),
        defaultValues: {
            informantName: '',
            fatherHusbandName: '',
            gender: '',
            address: '',
            contactNumber: '',
            email: '',
            incidentDate: '',
            incidentTime: '',
            incidentPlace: '',
            offenseType: '',
            briefFacts: '',
        }
    });

    const clearSignature = () => {
        sigPadRef.current?.clear();
    };

    const generatePdf = async (values: ZeroFirFormValues) => {
        if (!sigPadRef.current) return;

        setIsGenerating(true);
        setPdfData(values);

        // Allow time for the PDF data to render in the hidden template
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!pdfTemplateRef.current) return;

        const canvas = await html2canvas(pdfTemplateRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/jpeg', 0.6);

        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const height = pdfWidth / ratio;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(height, pdfHeight));
        pdf.save('Zero-FIR.pdf');

        setPdfData(null);
        setIsGenerating(false);
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto px-4 md:px-0">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">{t('zeroFir.title')}</CardTitle>
                    <CardDescription>{t('zeroFir.description')}</CardDescription>
                </CardHeader>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(generatePdf)} className="space-y-8">
                    {/* Section 1: Informant Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('zeroFir.sections.1')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="informantName" render={({ field }) => (<FormItem><FormLabel>{t('zeroFir.fields.informantName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="fatherHusbandName" render={({ field }) => (<FormItem><FormLabel>{t('zeroFir.fields.fatherHusbandName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel>{t('zeroFir.fields.age')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>{t('zeroFir.fields.gender')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('zeroFir.fields.genderOptions.select')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="Male">{t('zeroFir.fields.genderOptions.male')}</SelectItem><SelectItem value="Female">{t('zeroFir.fields.genderOptions.female')}</SelectItem><SelectItem value="Other">{t('zeroFir.fields.genderOptions.other')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="occupation" render={({ field }) => (<FormItem><FormLabel>{t('zeroFir.fields.occupation')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="contactNumber" render={({ field }) => (<FormItem><FormLabel>{t('zeroFir.fields.contactNumber')}</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>{t('zeroFir.fields.address')}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="email" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>{t('zeroFir.fields.email')}</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>

                    {/* Section 2: Incident Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('zeroFir.sections.2')}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="incidentDate" render={({ field }) => (<FormItem><FormLabel>{t('zeroFir.fields.incidentDate')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="incidentTime" render={({ field }) => (<FormItem><FormLabel>{t('zeroFir.fields.incidentTime')}</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="incidentPlace" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>{t('zeroFir.fields.incidentPlace')}</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="offenseType" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>{t('zeroFir.fields.offenseType')}</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="briefFacts" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>{t('zeroFir.fields.briefFacts')}</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="accusedDetails" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>{t('zeroFir.fields.accusedDetails')}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="witnessDetails" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>{t('zeroFir.fields.witnessDetails')}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>

                    {/* Section 3: Declaration & Signature */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('zeroFir.sections.3')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">{t('zeroFir.declaration')}</p>
                            <div>
                                <Label htmlFor="signature-pad">{t('zeroFir.fields.signatureLabel')}</Label>
                                <div className="mt-2 border rounded-md bg-background">
                                    <SignaturePad
                                        ref={sigPadRef}
                                        canvasProps={{ id: 'signature-pad', className: 'w-full h-[150px]' }}
                                    />
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={clearSignature} className="mt-2">
                                    <Eraser className="w-4 h-4 mr-2" />
                                    {t('zeroFir.fields.clearSignature')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" size="lg" disabled={isGenerating}>
                            {isGenerating ? <CircleDashed className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                            {isGenerating ? t('zeroFir.generating') : t('zeroFir.generateBtn')}
                        </Button>
                    </div>
                </form>
            </Form>

            {/* Hidden PDF Template */}
            <div className="absolute -left-[9999px] top-0 opacity-0 w-[210mm]">
                {pdfData && (
                    <div ref={pdfTemplateRef} className="p-[15mm] bg-white text-black font-['Noto_Sans_Devanagari']">
                        <style>{`
                            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap');
                            .pdf-page { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 12pt; color: #000; }
                            .pdf-header { text-align: center; margin-bottom: 10px; }
                            .pdf-header h2 { font-size: 16pt; font-weight: bold; margin: 0; }
                            .pdf-header p { font-size: 10pt; margin: 0; }
                            .pdf-hr { border: 0; border-top: 1px solid #000; margin: 8px 0; }
                            .pdf-section-header { font-size: 13pt; font-weight: bold; text-align: center; margin: 12px 0 8px 0; text-transform: uppercase; }
                            .pdf-field-row { display: flex; flex-wrap: wrap; margin-bottom: 6px; }
                            .pdf-label { font-weight: bold; min-width: 180px; }
                            .pdf-data { border-bottom: 1px dotted #000; flex-grow: 1; padding-left: 5px; }
                            .pdf-multiline-section { margin-top: 10px; }
                            .multiline-label { margin-bottom: 4px; }
                            .multiline-block { border: 1px dotted #000; padding: 5px; min-height: 40px; width: 100%; white-space: pre-wrap; word-wrap: break-word; }
                            .pdf-declaration { font-size: 11pt; font-style: italic; margin: 10px 0; text-align: justify; }
                            #pdf-signature-area { height: 50px; display: flex; align-items: center; }
                            #pdf-signatureImage { max-height: 45px; max-width: 150px; }
                            .pdf-spacer { height: 20px; }
                            .police-use-section { border: 1px solid #000; padding: 10px; margin-top: 15px; }
                            .police-section { border-bottom: 1px dotted #000; height: 25px; }
                        `}</style>
                        <div className="pdf-page">
                            <div className="pdf-header">
                                <h2>{t('zeroFir.pdf.title')}</h2>
                                <p>{t('zeroFir.pdf.subtitle')}</p>
                            </div>
                            <div className="pdf-field-row">
                                <span className="pdf-label">{t('zeroFir.pdf.dateReport')}</span><span className="pdf-data">{new Date().toLocaleDateString()}</span>
                                <span className="pdf-label" style={{ marginLeft: '30px' }}>{t('zeroFir.pdf.timeReport')}</span><span className="pdf-data">{new Date().toLocaleTimeString()}</span>
                            </div>
                            <hr className="pdf-hr" />

                            <div className="pdf-main-content">
                                <h3 className="pdf-section-header">{t('zeroFir.pdf.section1')}</h3>
                                <div className="pdf-field-row"><span className="pdf-label">{t('zeroFir.fields.informantName')}:</span><span className="pdf-data">{pdfData.informantName}</span></div>
                                <div className="pdf-field-row"><span className="pdf-label">{t('zeroFir.fields.fatherHusbandName')}:</span><span className="pdf-data">{pdfData.fatherHusbandName}</span></div>
                                <div className="pdf-field-row">
                                    <span className="pdf-label">{t('zeroFir.fields.age')}:</span><span className="pdf-data">{pdfData.age}</span>
                                    <span className="pdf-label" style={{ marginLeft: '30px' }}>{t('zeroFir.fields.gender')}:</span><span className="pdf-data">{pdfData.gender}</span>
                                </div>
                                <div className="pdf-field-row"><span className="pdf-label">{t('zeroFir.fields.occupation')}:</span><span className="pdf-data">{pdfData.occupation}</span></div>
                                <div className="pdf-field-row"><span className="pdf-label">{t('zeroFir.fields.address')}:</span><span className="pdf-data">{pdfData.address}</span></div>
                                <div className="pdf-field-row"><span className="pdf-label">{t('zeroFir.fields.contactNumber')}:</span><span className="pdf-data">{pdfData.contactNumber}</span></div>
                                <div className="pdf-field-row"><span className="pdf-label">{t('zeroFir.fields.email')}:</span><span className="pdf-data">{pdfData.email}</span></div>

                                <hr className="pdf-hr" />
                                <h3 className="pdf-section-header">{t('zeroFir.pdf.section2')}</h3>
                                <div className="pdf-field-row">
                                    <span className="pdf-label">{t('zeroFir.fields.incidentDate')}:</span><span className="pdf-data">{pdfData.incidentDate}</span>
                                    <span className="pdf-label" style={{ marginLeft: '30px' }}>{t('zeroFir.fields.incidentTime')}:</span><span className="pdf-data">{pdfData.incidentTime}</span>
                                </div>
                                <div className="pdf-field-row"><span className="pdf-label">{t('zeroFir.fields.incidentPlace')}:</span><span className="pdf-data">{pdfData.incidentPlace}</span></div>
                                <div className="pdf-field-row"><span className="pdf-label">• {t('zeroFir.fields.offenseType')}:</span><span className="pdf-data">{pdfData.offenseType}</span></div>

                                <div className="pdf-multiline-section">
                                    <div className="pdf-field-row multiline-label"><span className="pdf-label">{t('zeroFir.fields.briefFacts')}:</span></div>
                                    <div className="pdf-field-row"><div className="pdf-data multiline-block">{pdfData.briefFacts}</div></div>
                                </div>

                                <div className="pdf-multiline-section">
                                    <div className="pdf-field-row multiline-label"><span className="pdf-label">{t('zeroFir.fields.accusedDetails')}:</span></div>
                                    <div className="pdf-field-row"><div className="pdf-data multiline-block">{pdfData.accusedDetails || 'N/A'}</div></div>
                                </div>

                                <div className="pdf-multiline-section">
                                    <div className="pdf-field-row multiline-label"><span className="pdf-label">{t('zeroFir.fields.witnessDetails')}:</span></div>
                                    <div className="pdf-field-row"><div className="pdf-data multiline-block">{pdfData.witnessDetails || 'N/A'}</div></div>
                                </div>

                                <hr className="pdf-hr" />
                                <h3 className="pdf-section-header">{t('zeroFir.pdf.section3')}</h3>
                                <p className="pdf-declaration">{t('zeroFir.declaration')}</p>
                                <div className="pdf-field-row">
                                    <span className="pdf-label">{t('zeroFir.fields.signatureLabel')}</span>
                                    <div id="pdf-signature-area" className="pdf-data">
                                        <img id="pdf-signatureImage" src={sigPadRef.current?.toDataURL()} alt="Signature" />
                                    </div>
                                </div>
                                <div className="pdf-field-row"><span className="pdf-label">{t('zeroFir.pdf.printName')}</span><span className="pdf-data">{pdfData.informantName}</span></div>
                            </div>

                            <div className="pdf-spacer"></div>

                            <div className="police-use-section">
                                <h3 className="pdf-section-header">{t('zeroFir.pdf.policeUse')}</h3>
                                <p className="text-center text-sm mb-4">{t('zeroFir.pdf.policeNote')}</p>
                                <div className="police-section"><span className="pdf-label">{t('zeroFir.pdf.firNo')}</span></div>
                                <div className="police-section"><span className="pdf-label">{t('zeroFir.pdf.regDate')}</span></div>
                                <div className="police-section"><span className="pdf-label">{t('zeroFir.pdf.actSection')}</span></div>
                                <div className="police-section"><span className="pdf-label">{t('zeroFir.pdf.policeStation')}</span></div>
                                <div className="police-section"><span className="pdf-label">{t('zeroFir.pdf.district')}</span></div>
                                <div className="police-section"><span className="pdf-label">{t('zeroFir.pdf.policeSig')}</span></div>
                                <div className="police-section"><span className="pdf-label">{t('zeroFir.pdf.policeName')}</span></div>
                                <div className="police-section"><span className="pdf-label">{t('zeroFir.pdf.designation')}</span></div>
                                <div className="police-section"><span className="pdf-label">{t('zeroFir.pdf.badgeNo')}</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}