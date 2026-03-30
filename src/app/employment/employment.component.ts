import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';

interface EmploymentRole {
    title: string;
    timeline: string;
    location?: string;
    details: string[];
}

interface EmploymentGroup {
    company: string;
    type: string;
    summary?: string;
    roles: EmploymentRole[];
}

@Component({
    selector: 'app-employment',
    templateUrl: './employment.component.html',
    styleUrls: ['./employment.component.scss'],
    standalone: true,
    imports: [CommonModule]
})
export class EmploymentComponent {
    employmentGroups: EmploymentGroup[] = [
        {
            company: 'Yardi',
            type: 'Full-time',
            summary: 'Atlanta, Georgia, United States - Remote',
            roles: [
                {
                    title: 'Software Development Engineer III',
                    timeline: 'Oct 2023 - Present',
                    details: [
                        'Led development of the Affordable Waiting List feature in Compliance Manager, building end-to-end workflows with RentCafe integration, audit logging, and invitation-to-move-in flows.',
                        'Developed Member Verification and ID Verification capabilities for HUD 50059 certifications, including citizenship verification tracking and questionnaire-level validation steps.',
                        'Designed and delivered Roommate Application Management, including roommate application editing, resident portal preview, and registration invitation flows.',
                        'Built the inter-product link, improving navigation across related leasing workflows.'
                    ]
                },
                {
                    title: 'Software Development Engineer II',
                    timeline: 'Oct 2020 - Dec 2023',
                    location: 'Atlanta, Georgia, United States',
                    details: [
                        'Architected and delivered the Verification Letters system across the full stack, integrating document generation, file handling, and e-signature workflows.',
                        'Built the Verification Services integration so compliance staff could review third-party income verification results directly within certification records.',
                        'Developed the Prospect Applications module for Compliance Manager, adding lifecycle controls, status tracking, and page-slide navigation.',
                        'Refactored shared file application infrastructure into a multi-tenant library and improved dashboard and certification workflow accuracy.'
                    ]
                },
                {
                    title: 'Software Development Engineer I',
                    timeline: 'May 2019 - Oct 2020',
                    location: 'Atlanta Metropolitan Area',
                    details: [
                        'Designed and built the Schedule Unit Transfer module in Yardi Breeze, delivering an end-to-end multi-step workflow for affordable housing property managers.',
                        'Developed the Import Classic migration tool to move legacy affordable housing data into Breeze through bulk upload and extraction workflows.',
                        'Built the Other Housing Agency module from the ground up, including CRUD flows, filtering, and PDF reporting.',
                        'Delivered features across Market Rent Increase, Admin Fee, Portability, and Landlord Overpayment, while supporting safer rollouts with database packages for feature toggles and production data fixes.'
                    ]
                }
            ]
        },
        {
            company: 'Kennesaw State University',
            type: 'Part-time',
            summary: 'Atlanta Metropolitan Area',
            roles: [
                {
                    title: 'Computer Programming Tutor & Teaching Assistant',
                    timeline: 'Jan 2017 - May 2019',
                    details: [
                        'Tutor programming languages including Java, C#, C++, Python, and JavaScript.',
                        'Assist students in completing their assignments and clarifying concepts.'
                    ]
                },
                {
                    title: 'Data Collector',
                    timeline: 'Aug 2016 - Jan 2017',
                    details: [
                        'Survey residents in different areas using a questionnaire to aggregate data.',
                        'Enter responses in an automated system and produce reports.'
                    ]
                }
            ]
        },
        {
            company: 'SwordsAxe',
            type: 'Contract',
            summary: 'Atlanta Metropolitan Area',
            roles: [
                {
                    title: 'Web Developer',
                    timeline: 'Dec 2012 - Jan 2017',
                    details: [
                        'Add new components to the website.',
                        'Update and revise website content on a weekly basis.',
                        'Maintain the website and product catalog.'
                    ]
                }
            ]
        }
    ];
}
